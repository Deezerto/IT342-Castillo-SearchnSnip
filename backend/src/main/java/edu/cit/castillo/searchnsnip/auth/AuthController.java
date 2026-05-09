package edu.cit.castillo.searchnsnip.auth;

import edu.cit.castillo.searchnsnip.auth.security.JwtUtil;
import edu.cit.castillo.searchnsnip.entity.User;
import edu.cit.castillo.searchnsnip.service.UserService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Autowired
    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    // Register a new user
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user);
        return ResponseEntity.ok(createdUser);
    }

    // Login a user
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> authenticatedUser = userService.authenticateUser(loginRequest.getEmail(), loginRequest.getPassword());
        if (authenticatedUser.isPresent()) {
            User user = authenticatedUser.get();
            String token = jwtUtil.generateToken(user.getEmail());
            return ResponseEntity.ok(new LoginResponse(token));
        } else {
            return ResponseEntity.status(401).build();
        }
    }

    // Google Login
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
            .setAudience(Collections.singletonList("267431359144-re5kr186ca35igpul1rmva2i3f196d0i.apps.googleusercontent.com"))
            .build();

        try {
            GoogleIdToken idToken = verifier.verify(token);
            if (idToken != null) {
                GoogleIdToken.Payload googlePayload = idToken.getPayload();
                String email = googlePayload.getEmail();

                // Check if user exists, if not create one
                Optional<User> existingUser = userService.findByEmail(email);
                if (existingUser.isEmpty()) {
                    User newUser = new User();
                    newUser.setEmail(email);

                    String firstName = (String) googlePayload.get("given_name");
                    String lastName = (String) googlePayload.get("family_name");

                    newUser.setFirstName(firstName != null ? firstName : "Google");
                    newUser.setLastName(lastName != null ? lastName : "User");
                    newUser.setPassword("google_oauth_placeholder"); // Dummy password
                    userService.createUser(newUser);
                } else {
                    userService.updateLastLogin(existingUser.get().getUserId());
                }

                String jwt = jwtUtil.generateToken(email);
                return ResponseEntity.ok(Map.of("token", jwt));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid ID token.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public static class LoginResponse {
        private String token;

        public LoginResponse(String token) {
            this.token = token;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
