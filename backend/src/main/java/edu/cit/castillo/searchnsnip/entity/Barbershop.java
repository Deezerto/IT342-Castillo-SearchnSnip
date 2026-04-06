package edu.cit.castillo.searchnsnip.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "barbershops")
public class Barbershop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shop_id")
    private Long shopId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String address;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "contact_info")
    private String contactInfo;

    @ElementCollection
    @CollectionTable(name = "barbershop_images", joinColumns = @JoinColumn(name = "shop_id"))
    @Column(name = "image_data", columnDefinition = "TEXT")
    private List<String> showcaseImages = new ArrayList<>();

    @OneToMany(mappedBy = "barbershop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Service> services = new ArrayList<>();

    public Barbershop() {}

    public Long getShopId() { return shopId; }
    public void setShopId(Long shopId) { this.shopId = shopId; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getContactInfo() { return contactInfo; }
    public void setContactInfo(String contactInfo) { this.contactInfo = contactInfo; }

    public List<String> getShowcaseImages() { return showcaseImages; }
    public void setShowcaseImages(List<String> showcaseImages) { this.showcaseImages = showcaseImages; }

    public List<Service> getServices() { return services; }
    public void setServices(List<Service> services) { this.services = services; }
    
    public void addService(Service service) {
        services.add(service);
        service.setBarbershop(this);
    }
}
