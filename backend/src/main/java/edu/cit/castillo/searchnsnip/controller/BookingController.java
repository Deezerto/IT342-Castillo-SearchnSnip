package edu.cit.castillo.searchnsnip.controller;

import edu.cit.castillo.searchnsnip.entity.Booking;
import edu.cit.castillo.searchnsnip.entity.Service;
import edu.cit.castillo.searchnsnip.service.BookingWorkflowMediator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:3000")
public class BookingController {

    private final BookingWorkflowMediator bookingWorkflowMediator;

    @Autowired
    public BookingController(
            BookingWorkflowMediator bookingWorkflowMediator
    ) {
        this.bookingWorkflowMediator = bookingWorkflowMediator;
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest request, Authentication authentication) {
        BookingWorkflowMediator.CreateBookingInput input = new BookingWorkflowMediator.CreateBookingInput(
                request == null ? null : request.getShopId(),
                request == null ? null : request.getServiceIds(),
                request == null ? null : request.getAppointmentDate(),
                authentication == null ? null : authentication.getName()
        );

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
                        .toList()
        ));
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
