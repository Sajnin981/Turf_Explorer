package com.turfexplorer.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class SlotResponse {
    private Long id;
    private Long turfId;
    private LocalTime startTime;
    private LocalTime endTime;
    private Double price;
    private String status;
    private LocalDateTime createdAt;
}
