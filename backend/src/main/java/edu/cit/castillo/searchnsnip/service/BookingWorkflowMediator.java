package edu.cit.castillo.searchnsnip.service;

import edu.cit.castillo.searchnsnip.entity.Booking;
import edu.cit.castillo.searchnsnip.entity.Service;
import edu.cit.castillo.searchnsnip.entity.User;
import edu.cit.castillo.searchnsnip.repository.BookingRepository;
import edu.cit.castillo.searchnsnip.repository.ServiceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Component
public class BookingWorkflowMediator {

    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final UserService userService;

    public BookingWorkflowMediator(
            BookingRepository bookingRepository,
            ServiceRepository serviceRepository,
            UserService userService
    ) {
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.userService = userService;
    }

    @Transactional
    public CreateBookingOutcome createBooking(CreateBookingInput input) {
        if (input.getAuthenticatedEmail() == null || input.getAuthenticatedEmail().isBlank()) {
            return CreateBookingOutcome.failure(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        if (input.getShopId() == null) {
            return CreateBookingOutcome.failure(HttpStatus.BAD_REQUEST, "shopId is required");
        }

        if (input.getServiceIds() == null || input.getServiceIds().isEmpty()) {
            return CreateBookingOutcome.failure(HttpStatus.BAD_REQUEST, "At least one service must be selected");
        }

        Optional<User> userOpt = userService.findByEmail(input.getAuthenticatedEmail());
        if (userOpt.isEmpty()) {
            return CreateBookingOutcome.failure(HttpStatus.NOT_FOUND, "User not found");
        }

        Set<Long> uniqueServiceIds = input.getServiceIds()
                .stream()
                .filter(Objects::nonNull)
                .collect(LinkedHashSet::new, Set::add, Set::addAll);

        if (uniqueServiceIds.isEmpty()) {
            return CreateBookingOutcome.failure(HttpStatus.BAD_REQUEST, "At least one valid service must be selected");
        }

        List<Service> selectedServices = serviceRepository.findByBarbershop_ShopIdAndServiceIdIn(
                input.getShopId(),
                new ArrayList<>(uniqueServiceIds)
        );

        if (selectedServices.size() != uniqueServiceIds.size()) {
            return CreateBookingOutcome.failure(HttpStatus.BAD_REQUEST, "Some selected services are invalid for this barbershop");
        }

        double totalPrice = selectedServices
                .stream()
                .mapToDouble(service -> parsePriceValue(service.getPrice()))
                .sum();

        Booking booking = new Booking();
        booking.setUser(userOpt.get());
        booking.setServices(selectedServices);
        booking.setTotalPrice(totalPrice);
        booking.setStatus(Booking.STATUS_ACTIVE);
        booking.setAppointmentDate(parseAppointmentDate(input.getAppointmentDate()));

        Booking saved = bookingRepository.save(booking);
        return CreateBookingOutcome.success(saved);
    }

    private static LocalDateTime parseAppointmentDate(String rawDate) {
        if (rawDate == null || rawDate.isBlank()) {
            return LocalDateTime.now();
        }

        try {
            return LocalDate.parse(rawDate).atStartOfDay();
        } catch (DateTimeParseException ignored) {
            return LocalDateTime.now();
        }
    }

    private static double parsePriceValue(String rawPrice) {
        if (rawPrice == null || rawPrice.isBlank()) {
            return 0.0;
        }

        String normalized = rawPrice.replaceAll("[^\\d.]", "");
        if (normalized.isBlank()) {
            return 0.0;
        }

        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException ignored) {
            return 0.0;
        }
    }

    public static class CreateBookingInput {
        private final Long shopId;
        private final List<Long> serviceIds;
        private final String appointmentDate;
        private final String authenticatedEmail;

        public CreateBookingInput(Long shopId, List<Long> serviceIds, String appointmentDate, String authenticatedEmail) {
            this.shopId = shopId;
            this.serviceIds = serviceIds == null ? null : new ArrayList<>(serviceIds);
            this.appointmentDate = appointmentDate;
            this.authenticatedEmail = authenticatedEmail;
        }

        public Long getShopId() {
            return shopId;
        }

        public List<Long> getServiceIds() {
            return serviceIds;
        }

        public String getAppointmentDate() {
            return appointmentDate;
        }

        public String getAuthenticatedEmail() {
            return authenticatedEmail;
        }
    }

    public static class CreateBookingOutcome {
        private final HttpStatus status;
        private final String message;
        private final Booking booking;

        private CreateBookingOutcome(HttpStatus status, String message, Booking booking) {
            this.status = status;
            this.message = message;
            this.booking = booking;
        }

        public static CreateBookingOutcome success(Booking booking) {
            return new CreateBookingOutcome(HttpStatus.CREATED, null, booking);
        }

        public static CreateBookingOutcome failure(HttpStatus status, String message) {
            return new CreateBookingOutcome(status, message, null);
        }

        public HttpStatus getStatus() {
            return status;
        }

        public String getMessage() {
            return message;
        }

        public Booking getBooking() {
            return booking;
        }

        public boolean isSuccess() {
            return booking != null;
        }
    }
}
