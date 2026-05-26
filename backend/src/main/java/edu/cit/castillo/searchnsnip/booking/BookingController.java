package edu.cit.castillo.searchnsnip.booking;

import edu.cit.castillo.searchnsnip.entity.Booking;
import edu.cit.castillo.searchnsnip.entity.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:3000")
public class BookingController {

    private final BookingWorkflowMediator bookingWorkflowMediator;
    private final BookingRepository bookingRepository;

    @Autowired
    public BookingController(
            BookingWorkflowMediator bookingWorkflowMediator,
            BookingRepository bookingRepository) {
        this.bookingWorkflowMediator = bookingWorkflowMediator;
        this.bookingRepository = bookingRepository;
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest request, Authentication authentication) {
        BookingWorkflowMediator.CreateBookingInput input = new BookingWorkflowMediator.CreateBookingInput(
                request == null ? null : request.getShopId(),
                request == null ? null : request.getServiceIds(),
                request == null ? null : request.getAppointmentDate(),
                authentication == null ? null : authentication.getName());

        BookingWorkflowMediator.CreateBookingOutcome outcome = bookingWorkflowMediator.createBooking(input);
        if (!outcome.isSuccess()) {
            return ResponseEntity.status(outcome.getStatus()).body(outcome.getMessage());
        }

        Booking saved = outcome.getBooking();

        return ResponseEntity.status(HttpStatus.CREATED).body(new BookingSummary(
                saved.getBookingId(),
                saved.getStatus(),
                saved.getTotalPrice(),
                saved.getAppointmentDate() == null ? null : saved.getAppointmentDate().toString(),
                saved.getServices()
                        .stream()
                        .map(Service::getServiceId)
                        .toList()));
    }

    @org.springframework.web.bind.annotation.GetMapping
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getMyBookings(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        String email = authentication.getName();
        List<Booking> bookings = bookingRepository.findByUser_EmailOrderByAppointmentDateDesc(email);
        List<UserBookingSummary> summaries = bookings.stream().map(UserBookingSummary::fromEntity).toList();
        return ResponseEntity.ok(summaries);
    }

    @org.springframework.web.bind.annotation.PutMapping("/{bookingId}/cancel")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> cancelBooking(@org.springframework.web.bind.annotation.PathVariable Long bookingId,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        java.util.Optional<Booking> opt = bookingRepository.findById(bookingId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
        }
        Booking booking = opt.get();
        if (!booking.getUser().getEmail().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not your booking");
        }
        booking.setStatus(Booking.STATUS_CANCELLED);
        bookingRepository.save(booking);
        return ResponseEntity.ok(java.util.Map.of("message", "Booking cancelled", "bookingId", bookingId));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{bookingId}/complete")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> completeBooking(@org.springframework.web.bind.annotation.PathVariable Long bookingId,
            Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }
        java.util.Optional<Booking> opt = bookingRepository.findById(bookingId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found");
        }
        Booking booking = opt.get();
        
        boolean isOwner = false;
        List<Service> services = booking.getServices();
        if (services != null && !services.isEmpty() && services.get(0).getBarbershop() != null) {
            if (services.get(0).getBarbershop().getOwner() != null &&
                authentication.getName().equals(services.get(0).getBarbershop().getOwner().getEmail())) {
                isOwner = true;
            }
        }

        if (!isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not your barbershop's booking");
        }

        booking.setStatus(Booking.STATUS_COMPLETED);
        bookingRepository.save(booking);
        return ResponseEntity.ok(java.util.Map.of("message", "Booking completed", "bookingId", bookingId));
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
                List<Long> serviceIds) {
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

    public static class UserBookingSummary {
        private final Long bookingId;
        private final String shopName;
        private final String shopImage;
        private final String servicesTitle;
        private final String status;
        private final double totalPrice;
        private final String appointmentDate;

        public UserBookingSummary(
                Long bookingId,
                String shopName,
                String shopImage,
                String servicesTitle,
                String status,
                double totalPrice,
                String appointmentDate) {
            this.bookingId = bookingId;
            this.shopName = shopName;
            this.shopImage = shopImage;
            this.servicesTitle = servicesTitle;
            this.status = status;
            this.totalPrice = totalPrice;
            this.appointmentDate = appointmentDate;
        }

        public static UserBookingSummary fromEntity(Booking booking) {
            List<Service> services = booking.getServices() == null ? List.of() : booking.getServices();
            String shopName = "Unknown Shop";
            String shopImage = null;

            if (!services.isEmpty() && services.get(0).getBarbershop() != null) {
                shopName = services.get(0).getBarbershop().getName();
                List<String> images = services.get(0).getBarbershop().getShowcaseImages();
                if (images != null && !images.isEmpty()) {
                    shopImage = images.get(0);
                }
            }

            List<String> serviceNames = services.stream()
                    .map(s -> s.getName() == null || s.getName().isBlank() ? "Service" : s.getName())
                    .toList();

            String title;
            if (serviceNames.isEmpty()) {
                title = "Booking #" + booking.getBookingId();
            } else if (serviceNames.size() <= 2) {
                title = String.join(", ", serviceNames);
            } else {
                title = serviceNames.get(0) + ", " + serviceNames.get(1) + " +" + (serviceNames.size() - 2);
            }

            if (shopImage == null) {
                shopImage = services.stream().map(Service::getPhoto).filter(p -> p != null && !p.isBlank()).findFirst()
                        .orElse(null);
            }

            return new UserBookingSummary(
                    booking.getBookingId(),
                    shopName,
                    shopImage,
                    title,
                    booking.getStatus(),
                    booking.getTotalPrice() == null ? 0.0 : booking.getTotalPrice(),
                    booking.getAppointmentDate() == null ? null : booking.getAppointmentDate().toString());
        }

        public Long getBookingId() {
            return bookingId;
        }

        public String getShopName() {
            return shopName;
        }

        public String getShopImage() {
            return shopImage;
        }

        public String getServicesTitle() {
            return servicesTitle;
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
    }
}
