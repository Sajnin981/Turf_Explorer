package com.turfexplorer.entity;

import com.turfexplorer.enums.TurfStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "turfs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Turf {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String location;

    // Geographic coordinates used for location-based discovery features
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;
    
    @Column(name = "turf_type", nullable = false)
    private String turfType;
    
    @Column(name = "price_per_hour", nullable = false)
    private Double pricePerHour;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;
    
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TurfStatus status = TurfStatus.PENDING;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
