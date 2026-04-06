package edu.cit.castillo.searchnsnip.controller;

import edu.cit.castillo.searchnsnip.entity.Booking;
import edu.cit.castillo.searchnsnip.entity.Service;
import edu.cit.castillo.searchnsnip.entity.User;
import edu.cit.castillo.searchnsnip.repository.BookingRepository;
import edu.cit.castillo.searchnsnip.repository.ServiceRepository;
import edu.cit.castillo.searchnsnip.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:3000")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final UserService userService;

    @Autowired
    public BookingController(
            BookingRepository bookingRepository,
            ServiceRepository serviceRepository,
            UserService userService
    ) {
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.userService = userService;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest request, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        if (request == null || request.getShopId() == null) {
            return ResponseEntity.badRequest().body("shopId is required");
        }

        if (request.getServiceIds() == null || request.getServiceIds().isEmpty()) {
            return ResponseEntity.badRequest().body("At least one service must be selected");
        }

        String email = authentication.getName();
        Optional<User> userOpt = userService.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        Set<Long> uniqueServiceIds = request.getServiceIds()
            .stream()
            .filter(Objects::nonNull)
            .collect(LinkedHashSet::new, Set::add, Set::addAll);

        if (uniqueServiceIds.isEmpty()) {
            return ResponseEntity.badRequest().body("At least one valid service must be selected");
        }

        List<Long> serviceIds = new ArrayList<>(uniqueServiceIds);

        List<Service> selectedServices = serviceRepository.findByBarbershop_ShopIdAndServiceIdIn(
                request.getShopId(),
                serviceIds
        );

        if (selectedServices.size() != uniqueServiceIds.size()) {
            return ResponseEntity.badRequest().body("Some selected services are invalid for this barbershop");
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
        booking.setAppointmentDate(parseAppointmentDate(request.getAppointmentDate()));

        Booking saved = bookingRepository.save(booking);

        return ResponseEntity.status(HttpStatus.CREATED).body(new BookingSummary(
                saved.getBookingId(),
                saved.getStatus(),
                saved.getTotalPrice(),
                saved.getAppointmentDate() == null ? null : saved.getAppointmentDate().toString(),
                saved.getServices()
                        .stream()
                        .map(Service::getServiceId)
                        .toList()
        ));
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

    public static class CreateBookingRequest {
        private Long shopId;
        private List<Long> serviceIds;
        private String appointmentDate;

        public Long getShopId() {
            return shopId;
        }

        public void setShopId(Long shopId) {
            this.shopId = shopId;
        }

        public List<Long> getServiceIds() {
            return serviceIds;
        }

        public void setServiceIds(List<Long> serviceIds) {
            this.serviceIds = serviceIds;
        }

        public String getAppointmentDate() {
            return appointmentDate;
        }

        public void setAppointmentDate(String appointmentDate) {
            this.appointmentDate = appointmentDate;
        }
    }

    public static class BookingSummary {
        private final Long bookingId;
        private final String status;
        private final double totalPrice;
        private final String appointmentDate;
        private final List<Long> serviceIds;

        public BookingSummary(
                Long bookingId,
                String status,
                double totalPrice,
                String appointmentDate,
                List<Long> serviceIds
        ) {
            this.bookingId = bookingId;
            this.status = status;
            this.totalPrice = totalPrice;
            this.appointmentDate = appointmentDate;
            this.serviceIds = serviceIds;
        }

        public Long getBookingId() {
            return bookingId;
        }

        public String getStatus() {
            return status;
        }

        public double getTotalPrice() {
            return totalPrice;
        }

        public String getAppointmentDate() {
            return appointmentDate;
        }

        public List<Long> getServiceIds() {
            return serviceIds;
        }
    }
}
