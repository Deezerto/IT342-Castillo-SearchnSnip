package edu.cit.castillo.searchnsnip.service;

import edu.cit.castillo.searchnsnip.entity.User;
import edu.cit.castillo.searchnsnip.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(User user) {
        // Hash the password before saving to the database
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Optional<User> authenticateUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Secure BCrypt comparison
            if (passwordEncoder.matches(password, user.getPassword())) {
                user.setLastLogin(LocalDateTime.now());
                return Optional.of(userRepository.save(user));
            }
        }
        return Optional.empty();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User updateLastLogin(Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setLastLogin(LocalDateTime.now());
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}