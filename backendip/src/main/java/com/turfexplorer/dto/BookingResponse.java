package com.turfexplorer.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class BookingResponse {
    private Long id;
    private Long transactionId;
    private String paymentId;
    private String trxId;
    private Double transactionAmount;
    private Long userId;
    private Long turfId;
    private Long slotId;
    private LocalDate bookingDate;
    private String status;
    private String paymentStatus;
    private String transactionStatus;
    private LocalDateTime createdAt;
    
    // Additional fields for detailed view
    private String turfName;
    private String turfLocation;
    private String slotTime;
    private Double price;
}
