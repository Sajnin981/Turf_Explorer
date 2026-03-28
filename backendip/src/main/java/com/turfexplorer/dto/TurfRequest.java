package com.turfexplorer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class TurfRequest {
    
    @NotBlank(message = "Turf name is required")
    private String name;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    @NotBlank(message = "Turf type is required")
    private String turfType;
    
    @NotNull(message = "Price per hour is required")
    @Positive(message = "Price per hour must be positive")
    private Double pricePerHour;
    
    private String description;
    
    private String imageUrl;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;
}
