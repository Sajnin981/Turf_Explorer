package com.turfexplorer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentExecuteRequest {

    @NotBlank(message = "paymentID is required")
    private String paymentID;
}
