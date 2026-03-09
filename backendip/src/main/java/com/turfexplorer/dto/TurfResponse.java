package com.turfexplorer.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TurfResponse {
    private Long id;
    private String name;
    private String location;
    private String turfType;
    private Double pricePerHour;
    private String description;
    private String imageUrl;
    private Long ownerId;
    private String status;
    private LocalDateTime createdAt;
}
