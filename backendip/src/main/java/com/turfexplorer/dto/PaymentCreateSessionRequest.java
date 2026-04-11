package com.turfexplorer.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentCreateSessionRequest {

    @NotNull(message = "bookingId is required")
    private Long bookingId;
}
