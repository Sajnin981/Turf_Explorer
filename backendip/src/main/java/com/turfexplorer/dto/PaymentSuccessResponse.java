package com.turfexplorer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PaymentSuccessResponse {
    private Double amount;
    private String status;
    private String bookingStatus;
}