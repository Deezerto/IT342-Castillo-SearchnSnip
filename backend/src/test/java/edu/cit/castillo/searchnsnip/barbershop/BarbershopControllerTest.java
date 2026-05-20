package edu.cit.castillo.searchnsnip.barbershop;

import edu.cit.castillo.searchnsnip.auth.security.JwtUtil;
import edu.cit.castillo.searchnsnip.booking.BookingRepository;
import edu.cit.castillo.searchnsnip.entity.Barbershop;
import edu.cit.castillo.searchnsnip.entity.Service;
import edu.cit.castillo.searchnsnip.entity.User;
import edu.cit.castillo.searchnsnip.service.UserService;
import edu.cit.castillo.searchnsnip.auth.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import edu.cit.castillo.searchnsnip.config.SecurityConfig;
import org.springframework.context.annotation.Import;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.BeforeEach;
import static org.mockito.Mockito.doAnswer;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BarbershopController.class)
@Import(SecurityConfig.class)
class BarbershopControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @MockitoBean
  private BarbershopRepository barbershopRepository;

  @MockitoBean
  private BookingRepository bookingRepository;

  @MockitoBean
  private UserService userService;

  @MockitoBean
  private JwtUtil jwtUtil;

  @MockitoBean
  private JwtAuthenticationFilter jwtAuthFilter;

  @BeforeEach
  void setUpSecurity() throws Exception {
    doAnswer(invocation -> {
      FilterChain chain = invocation.getArgument(2);
      chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
      return null;
    }).when(jwtAuthFilter).doFilter(any(ServletRequest.class), any(ServletResponse.class), any(FilterChain.class));
  }

  @Test
  void getAllBarbershopsReturnsSummary() throws Exception {
    Barbershop shop = new Barbershop();
    shop.setShopId(10L);
    shop.setName("Classic Cuts");
    shop.setDescription("Traditional cuts");
    shop.setAddress("123 Main Street");
    shop.setLatitude(10.5);
    shop.setLongitude(123.9);
    shop.setContactInfo("0917-000-0000");
    shop.setShowcaseImages(List.of("image-1"));

    when(barbershopRepository.findAll()).thenReturn(List.of(shop));

    mockMvc.perform(get("/api/shops").with(user("user@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].shopId").value(10))
        .andExpect(jsonPath("$[0].name").value("Classic Cuts"))
        .andExpect(jsonPath("$[0].showcaseImages[0]").value("image-1"));
  }

  @Test
  void getBarbershopServicesReturnsServices() throws Exception {
    Barbershop shop = new Barbershop();
    shop.setShopId(5L);

    Service service = new Service();
    service.setServiceId(21L);
    service.setName("Premium Cut");
    service.setDescription("Clean fade");
    service.setPrice("450");
    service.setDuration("30 min");
    service.setPhoto("photo-url");
    service.setBarbershop(shop);

    shop.setServices(List.of(service));

    when(barbershopRepository.findById(5L)).thenReturn(Optional.of(shop));

    mockMvc.perform(get("/api/shops/5/services").with(user("user@example.com")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].serviceId").value(21))
        .andExpect(jsonPath("$[0].name").value("Premium Cut"))
        .andExpect(jsonPath("$[0].price").value("450"));
  }

  @Test
  void createBarbershopAssignsOwnerAndServices() throws Exception {
    User owner = new User();
    owner.setUserId(99L);
    owner.setEmail("owner@example.com");
    owner.setFirstName("Alex");
    owner.setLastName("Barber");
    owner.setPassword("secret");

    when(userService.findByEmail("owner@example.com")).thenReturn(Optional.of(owner));
    when(barbershopRepository.save(any(Barbershop.class))).thenAnswer(invocation -> {
      Barbershop saved = invocation.getArgument(0);
      saved.setShopId(123L);
      return saved;
    });

    String payload = """
        {
          "name": "Classic Cuts",
          "description": "Traditional cuts",
          "address": "123 Main Street",
          "latitude": 10.5,
          "longitude": 123.9,
          "contactInfo": "0917-000-0000",
          "showcaseImages": ["image-1"],
          "services": [
            {
              "name": "Premium Cut",
              "description": "Clean fade",
              "price": "450",
              "duration": "30 min",
              "photo": "photo-url"
            }
          ]
        }
        """;

    mockMvc.perform(post("/api/shops")
        .with(user("owner@example.com"))
        .contentType(MediaType.APPLICATION_JSON)
        .content(payload))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.shopId").value(123))
        .andExpect(jsonPath("$.name").value("Classic Cuts"));

    ArgumentCaptor<Barbershop> captor = ArgumentCaptor.forClass(Barbershop.class);
    verify(barbershopRepository).save(captor.capture());

    Barbershop captured = captor.getValue();
    assertSame(owner, captured.getOwner());
    assertNotNull(captured.getServices());
    assertEquals(1, captured.getServices().size());
    assertSame(captured, captured.getServices().get(0).getBarbershop());
  }
}
