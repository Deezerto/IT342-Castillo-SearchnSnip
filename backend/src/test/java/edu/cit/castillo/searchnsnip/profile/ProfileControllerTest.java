package edu.cit.castillo.searchnsnip.profile;

import edu.cit.castillo.searchnsnip.auth.security.JwtAuthenticationFilter;
import edu.cit.castillo.searchnsnip.auth.security.JwtUtil;
import edu.cit.castillo.searchnsnip.entity.User;
import edu.cit.castillo.searchnsnip.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import edu.cit.castillo.searchnsnip.config.SecurityConfig;
import org.springframework.context.annotation.Import;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.BeforeEach;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProfileController.class)
@Import(SecurityConfig.class)
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private edu.cit.castillo.searchnsnip.auth.security.JwtAuthenticationFilter jwtAuthFilter;

    @BeforeEach
    void setUpSecurity() throws Exception {
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthFilter).doFilter(any(ServletRequest.class), any(ServletResponse.class), any(FilterChain.class));
    }

    @Test
    void getCurrentUserReturnsName() throws Exception {
        User user = new User();
        user.setUserId(7L);
        user.setEmail("alex@example.com");
        user.setFirstName("Alex");
        user.setLastName("Barber");
        user.setPassword("secret");

        when(userService.findByEmail("alex@example.com")).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/users/me")
                        .with(user("alex@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alex@example.com"))
                .andExpect(jsonPath("$.firstName").value("Alex"))
                .andExpect(jsonPath("$.lastName").value("Barber"));
    }
}
