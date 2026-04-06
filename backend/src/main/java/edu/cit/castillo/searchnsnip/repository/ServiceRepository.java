package edu.cit.castillo.searchnsnip.repository;

import edu.cit.castillo.searchnsnip.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {
	List<Service> findByBarbershop_ShopIdAndServiceIdIn(Long shopId, List<Long> serviceIds);
}
