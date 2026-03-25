package com.turfexplorer.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TurfResponse {
    private Long id;
    private String name;
    private String location;
    private Double latitude;
    private Double longitude;
    private String turfType;
    private Double pricePerHour;
    private String description;
    private String imageUrl;
    private Long ownerId;
    private String status;
    private LocalDateTime createdAt;
    // Populated only when distance-based search is requested
    private Double distanceKm;
}
