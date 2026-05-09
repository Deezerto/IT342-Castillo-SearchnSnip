package edu.cit.castillo.searchnsnip.booking;

import edu.cit.castillo.searchnsnip.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findDistinctByServices_Barbershop_ShopIdOrderByAppointmentDateAsc(Long shopId);
}
