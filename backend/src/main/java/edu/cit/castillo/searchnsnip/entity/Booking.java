package edu.cit.castillo.searchnsnip.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "booking")
public class Booking {

    public static final String STATUS_ACTIVE = "Active";
    public static final String STATUS_COMPLETED = "Completed";
    public static final String STATUS_CANCELLED = "Cancelled";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Long bookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "appointment_date")
    private LocalDateTime appointmentDate;

    @Column
    private String status;

    @Column(name = "total_price")
    private Double totalPrice;

    @ManyToMany
    @JoinTable(
            name = "barber_service",
            joinColumns = @JoinColumn(name = "booking_id"),
            inverseJoinColumns = @JoinColumn(name = "service_id")
    )
    private List<Service> services = new ArrayList<>();

    public Booking() {
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDateTime appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        String normalized = normalizeStatus(status);
        if (!isAllowedStatus(normalized)) {
            throw new IllegalArgumentException("Invalid booking status: " + status);
        }
        this.status = normalized;
    }

    public Double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public List<Service> getServices() {
        return services;
    }

    public void setServices(List<Service> services) {
        this.services = services;
    }

    @PrePersist
    public void onCreate() {
        if (status == null || status.isBlank()) {
            status = STATUS_ACTIVE;
        }
    }

    private static String normalizeStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return STATUS_ACTIVE;
        }

        String trimmed = rawStatus.trim();
        if (trimmed.equalsIgnoreCase(STATUS_ACTIVE)) {
            return STATUS_ACTIVE;
        }
        if (trimmed.equalsIgnoreCase(STATUS_COMPLETED)) {
            return STATUS_COMPLETED;
        }
        if (trimmed.equalsIgnoreCase(STATUS_CANCELLED)) {
            return STATUS_CANCELLED;
        }

        return trimmed;
    }

    private static boolean isAllowedStatus(String normalizedStatus) {
        return STATUS_ACTIVE.equals(normalizedStatus)
                || STATUS_COMPLETED.equals(normalizedStatus)
                || STATUS_CANCELLED.equals(normalizedStatus);
    }
}