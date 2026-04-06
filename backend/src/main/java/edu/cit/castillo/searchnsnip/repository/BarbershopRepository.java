package edu.cit.castillo.searchnsnip.repository;

import edu.cit.castillo.searchnsnip.entity.Barbershop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BarbershopRepository extends JpaRepository<Barbershop, Long> {
	List<Barbershop> findByOwner_UserId(Long userId);
}
