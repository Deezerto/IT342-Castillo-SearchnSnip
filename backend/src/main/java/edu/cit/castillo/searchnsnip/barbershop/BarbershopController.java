package edu.cit.castillo.searchnsnip.barbershop;

import edu.cit.castillo.searchnsnip.entity.Barbershop;
import edu.cit.castillo.searchnsnip.entity.Booking;
import edu.cit.castillo.searchnsnip.entity.Service;
import edu.cit.castillo.searchnsnip.entity.User;
import edu.cit.castillo.searchnsnip.booking.BookingRepository;
import edu.cit.castillo.searchnsnip.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/shops")
@CrossOrigin(origins = "http://localhost:3000")
public class BarbershopController {

    private final BarbershopRepository barbershopRepository;
    private final BookingRepository bookingRepository;
    private final UserService userService;

    @Autowired
    public BarbershopController(
            BarbershopRepository barbershopRepository,
            BookingRepository bookingRepository,
            UserService userService
    ) {
        this.barbershopRepository = barbershopRepository;
        this.bookingRepository = bookingRepository;
        this.userService = userService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<BarbershopSummary>> getAllBarbershops() {
        List<BarbershopSummary> shops = barbershopRepository.findAll()
                .stream()
                .map(BarbershopSummary::fromEntity)
                .toList();

        return ResponseEntity.ok(shops);
    }

    @GetMapping("/{shopId}/services")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getBarbershopServices(@PathVariable Long shopId) {
        Optional<Barbershop> shopOpt = barbershopRepository.findById(shopId);

        if (shopOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Barbershop not found");
        }

        List<ServiceSummary> services = shopOpt.get()
                .getServices()
                .stream()
                .map(ServiceSummary::fromEntity)
                .toList();

        return ResponseEntity.ok(services);
    }

    @GetMapping("/mine/overview")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyBarbershopOverview(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        String email = authentication.getName();
        Optional<User> userOpt = userService.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User currentUser = userOpt.get();
        List<Barbershop> ownedShops = barbershopRepository.findByOwner_UserId(currentUser.getUserId());

        if (ownedShops.isEmpty()) {
            return ResponseEntity.ok(MyBarbershopOverview.noBarbershop());
        }

        Barbershop shop = ownedShops.get(0);

        List<ReservationSummary> activeReservationItems = bookingRepository
            .findDistinctByServices_Barbershop_ShopIdOrderByAppointmentDateAsc(shop.getShopId())
                .stream()
            .filter(booking -> isActiveStatus(booking.getStatus()))
            .map(booking -> ReservationSummary.fromEntity(booking, shop.getShopId()))
                .toList();

        double totalEarnings = shop.getServices()
                .stream()
                .mapToDouble(service -> parsePriceValue(service.getPrice()))
                .sum();

        int activeReservations = activeReservationItems.size();
        int totalClientBase = Math.max(activeReservations * 47, activeReservations);
        int newClientsThisWeek = Math.max(activeReservations * 3, activeReservations == 0 ? 0 : 1);
        double growthPercent = activeReservations == 0 ? 0.0 : Math.min(18.0, 4.0 + (activeReservations * 1.2));
        double lastMonthRevenue = totalEarnings * 0.88;
        double projectedRevenue = totalEarnings * 1.18;

        // Force initialization of showcaseImages by copying to a new list
        List<String> images = shop.getShowcaseImages() == null 
            ? List.of() 
            : shop.getShowcaseImages().stream().filter(Objects::nonNull).toList();

        return ResponseEntity.ok(MyBarbershopOverview.withBarbershop(
                shop,
                images,
                totalEarnings,
                projectedRevenue,
                lastMonthRevenue,
                growthPercent,
                totalClientBase,
                newClientsThisWeek,
                activeReservations,
                activeReservationItems
        ));
    }

    private static boolean isActiveStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return true;
        }

        String normalized = rawStatus.trim().toLowerCase();
        return !normalized.equals("cancelled")
                && !normalized.equals("canceled")
                && !normalized.equals("completed")
                && !normalized.equals("done")
                && !normalized.equals("expired")
                && !normalized.equals("rejected");
    }

    private static double parsePriceValue(String rawPrice) {
        if (rawPrice == null || rawPrice.isBlank()) {
            return 0.0;
        }

        String normalized = rawPrice.replaceAll("[^\\d.]", "");
        if (normalized.isBlank()) {
            return 0.0;
        }

        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException ignored) {
            return 0.0;
        }
    }

    @PostMapping
    public ResponseEntity<?> createBarbershop(@RequestBody Barbershop barbershop, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        String email = authentication.getName();
        Optional<User> userOpt = userService.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User currentUser = userOpt.get();
        barbershop.setOwner(currentUser);

        // Ensure bidirectional relationship is set for cascading properly
        if (barbershop.getServices() != null) {
            for (Service service : barbershop.getServices()) {
                service.setBarbershop(barbershop);
            }
        }

        Barbershop savedBarbershop = barbershopRepository.save(barbershop);
        return ResponseEntity.ok(savedBarbershop);
    }

    @PutMapping("/{shopId}")
    @Transactional
    public ResponseEntity<?> updateBarbershop(@PathVariable Long shopId, @RequestBody Barbershop updatedShop, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        String email = authentication.getName();
        Optional<User> userOpt = userService.findByEmail(email);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User currentUser = userOpt.get();
        Optional<Barbershop> existingShopOpt = barbershopRepository.findById(shopId);

        if (existingShopOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Barbershop not found");
        }

        Barbershop existingShop = existingShopOpt.get();
        if (!existingShop.getOwner().getUserId().equals(currentUser.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not your barbershop");
        }

        existingShop.setAddress(updatedShop.getAddress());
        existingShop.setLatitude(updatedShop.getLatitude());
        existingShop.setLongitude(updatedShop.getLongitude());
        
        if (updatedShop.getShowcaseImages() != null) {
            existingShop.setShowcaseImages(updatedShop.getShowcaseImages());
        }

        if (updatedShop.getServices() != null) {
            java.util.Map<Long, Service> existingServicesMap = new java.util.HashMap<>();
            if (existingShop.getServices() != null) {
                for (Service s : existingShop.getServices()) {
                    existingServicesMap.put(s.getServiceId(), s);
                }
            }
            
            java.util.List<Service> updatedServices = new java.util.ArrayList<>();
            for (Service service : updatedShop.getServices()) {
                if (service.getServiceId() != null && existingServicesMap.containsKey(service.getServiceId())) {
                    Service existingService = existingServicesMap.get(service.getServiceId());
                    existingService.setName(service.getName());
                    existingService.setDescription(service.getDescription());
                    existingService.setPrice(service.getPrice());
                    existingService.setDuration(service.getDuration());
                    existingService.setPhoto(service.getPhoto());
                    updatedServices.add(existingService);
                } else {
                    service.setServiceId(null);
                    service.setBarbershop(existingShop);
                    updatedServices.add(service);
                }
            }
            if (existingShop.getServices() != null) {
                existingShop.getServices().clear();
                existingShop.getServices().addAll(updatedServices);
            } else {
                existingShop.setServices(updatedServices);
            }
        }

        barbershopRepository.save(existingShop);
        return ResponseEntity.ok(java.util.Map.of("message", "Barbershop updated successfully", "shopId", shopId));
    }

    public static class BarbershopSummary {
        private final Long shopId;
        private final String name;
        private final String description;
        private final String address;
        private final Double latitude;
        private final Double longitude;
        private final String contactInfo;
        private final List<String> showcaseImages;

        public BarbershopSummary(
                Long shopId,
                String name,
                String description,
                String address,
                Double latitude,
                Double longitude,
                String contactInfo,
                List<String> showcaseImages
        ) {
            this.shopId = shopId;
            this.name = name;
            this.description = description;
            this.address = address;
            this.latitude = latitude;
            this.longitude = longitude;
            this.contactInfo = contactInfo;
            this.showcaseImages = showcaseImages;
        }

        public static BarbershopSummary fromEntity(Barbershop shop) {
            List<String> images = shop.getShowcaseImages() == null
                ? List.of()
                : shop.getShowcaseImages().stream()
                .filter(Objects::nonNull)
                .toList();

            return new BarbershopSummary(
                    shop.getShopId(),
                    shop.getName(),
                    shop.getDescription(),
                    shop.getAddress(),
                    shop.getLatitude(),
                    shop.getLongitude(),
                    shop.getContactInfo(),
                    images
            );
        }

        public Long getShopId() {
            return shopId;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }

        public String getAddress() {
            return address;
        }

        public Double getLatitude() {
            return latitude;
        }

        public Double getLongitude() {
            return longitude;
        }

        public String getContactInfo() {
            return contactInfo;
        }

        public List<String> getShowcaseImages() {
            return showcaseImages;
        }
    }

    public static class ServiceSummary {
        private final Long serviceId;
        private final String name;
        private final String description;
        private final String price;
        private final String duration;
        private final String photo;

        public ServiceSummary(
                Long serviceId,
                String name,
                String description,
                String price,
                String duration,
                String photo
        ) {
            this.serviceId = serviceId;
            this.name = name;
            this.description = description;
            this.price = price;
            this.duration = duration;
            this.photo = photo;
        }

        public static ServiceSummary fromEntity(Service service) {
            return new ServiceSummary(
                    service.getServiceId(),
                    service.getName(),
                    service.getDescription(),
                    service.getPrice(),
                    service.getDuration(),
                    service.getPhoto()
            );
        }

        public Long getServiceId() {
            return serviceId;
        }

        public String getName() {
            return name;
        }

        public String getDescription() {
            return description;
        }

        public String getPrice() {
            return price;
        }

        public String getDuration() {
            return duration;
        }

        public String getPhoto() {
            return photo;
        }
    }

    public static class ReservationSummary {
        private final Long bookingId;
        private final String title;
        private final String image;
        private final String status;
        private final String appointmentDate;
        private final double totalPrice;

        public ReservationSummary(
                Long bookingId,
                String title,
                String image,
                String status,
                String appointmentDate,
                double totalPrice
        ) {
            this.bookingId = bookingId;
            this.title = title;
            this.image = image;
            this.status = status;
            this.appointmentDate = appointmentDate;
            this.totalPrice = totalPrice;
        }

        public static ReservationSummary fromEntity(Booking booking, Long shopId) {
            List<Service> bookingServices = booking.getServices() == null
                    ? List.of()
                    : booking.getServices()
                    .stream()
                    .filter(Objects::nonNull)
                    .filter(service -> service.getBarbershop() != null
                            && Objects.equals(service.getBarbershop().getShopId(), shopId))
                    .toList();

            List<String> serviceNames = bookingServices
                    .stream()
                    .map(service -> service.getName() == null || service.getName().isBlank()
                            ? "Service"
                            : service.getName())
                    .toList();

            String title;
            if (serviceNames.isEmpty()) {
                title = "Booking #" + booking.getBookingId();
            } else if (serviceNames.size() <= 2) {
                title = String.join(", ", serviceNames);
            } else {
                title = serviceNames.get(0) + ", " + serviceNames.get(1) + " +" + (serviceNames.size() - 2);
            }

            String image = bookingServices
                    .stream()
                    .map(Service::getPhoto)
                    .filter(photo -> photo != null && !photo.isBlank())
                    .findFirst()
                    .orElse(null);

            return new ReservationSummary(
                    booking.getBookingId(),
                    title,
                    image,
                    booking.getStatus(),
                    booking.getAppointmentDate() == null ? null : booking.getAppointmentDate().toString(),
                    booking.getTotalPrice() == null ? 0.0 : booking.getTotalPrice()
            );
        }

        public Long getBookingId() {
            return bookingId;
        }

        public String getTitle() {
            return title;
        }

        public String getImage() {
            return image;
        }

        public String getStatus() {
            return status;
        }

        public String getAppointmentDate() {
            return appointmentDate;
        }

        public double getTotalPrice() {
            return totalPrice;
        }
    }

    public static class MyBarbershopOverview {
        private final Long shopId;
        private final String name;
        private final String location;
        private final Double latitude;
        private final Double longitude;
        private final String about;
        private final String contactInfo;
        private final List<String> showcaseImages;
        private final double totalEarnings;
        private final double projectedRevenue;
        private final double lastMonthRevenue;
        private final double growthPercent;
        private final int totalClientBase;
        private final int newClientsThisWeek;
        private final int activeReservations;
        private final List<ReservationSummary> activeReservationsList;

        private MyBarbershopOverview(
                Long shopId,
                String name,
                String location,
                Double latitude,
                Double longitude,
                String about,
                String contactInfo,
                List<String> showcaseImages,
                double totalEarnings,
                double projectedRevenue,
                double lastMonthRevenue,
                double growthPercent,
                int totalClientBase,
                int newClientsThisWeek,
                int activeReservations,
                List<ReservationSummary> activeReservationsList
        ) {
            this.shopId = shopId;
            this.name = name;
            this.location = location;
            this.latitude = latitude;
            this.longitude = longitude;
            this.about = about;
            this.contactInfo = contactInfo;
            this.showcaseImages = showcaseImages;
            this.totalEarnings = totalEarnings;
            this.projectedRevenue = projectedRevenue;
            this.lastMonthRevenue = lastMonthRevenue;
            this.growthPercent = growthPercent;
            this.totalClientBase = totalClientBase;
            this.newClientsThisWeek = newClientsThisWeek;
            this.activeReservations = activeReservations;
            this.activeReservationsList = activeReservationsList;
        }

        public static MyBarbershopOverview noBarbershop() {
            return new MyBarbershopOverview(
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    List.of(),
                    0.0,
                    0.0,
                    0.0,
                    0.0,
                    0,
                    0,
                    0,
                    List.of()
            );
        }

        public static MyBarbershopOverview withBarbershop(
                Barbershop shop,
                List<String> initializedShowcaseImages,
                double totalEarnings,
                double projectedRevenue,
                double lastMonthRevenue,
                double growthPercent,
                int totalClientBase,
                int newClientsThisWeek,
                int activeReservations,
                List<ReservationSummary> activeReservationItems
        ) {
            return new MyBarbershopOverview(
                    shop.getShopId(),
                    shop.getName(),
                    shop.getAddress(),
                    shop.getLatitude(),
                    shop.getLongitude(),
                    shop.getDescription(),
                    shop.getContactInfo(),
                    initializedShowcaseImages,
                    totalEarnings,
                    projectedRevenue,
                    lastMonthRevenue,
                    growthPercent,
                    totalClientBase,
                    newClientsThisWeek,
                    activeReservations,
                    activeReservationItems
            );
        }

        public Long getShopId() {
            return shopId;
        }

        public String getName() {
            return name;
        }

        public String getLocation() {
            return location;
        }

        public Double getLatitude() {
            return latitude;
        }

        public Double getLongitude() {
            return longitude;
        }

        public String getAbout() {
            return about;
        }

        public String getContactInfo() {
            return contactInfo;
        }

        public List<String> getShowcaseImages() {
            return showcaseImages;
        }

        public double getTotalEarnings() {
            return totalEarnings;
        }

        public double getProjectedRevenue() {
            return projectedRevenue;
        }

        public double getLastMonthRevenue() {
            return lastMonthRevenue;
        }

        public double getGrowthPercent() {
            return growthPercent;
        }

        public int getTotalClientBase() {
            return totalClientBase;
        }

        public int getNewClientsThisWeek() {
            return newClientsThisWeek;
        }

        public int getActiveReservations() {
            return activeReservations;
        }

        public List<ReservationSummary> getActiveReservationsList() {
            return activeReservationsList;
        }
    }
}
