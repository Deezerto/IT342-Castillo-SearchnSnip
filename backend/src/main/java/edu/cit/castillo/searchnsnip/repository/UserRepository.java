package edu.cit.castillo.searchnsnip.repository;

import edu.cit.castillo.searchnsnip.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Finds a user by their email address
    Optional<User> findByEmail(String email);
}