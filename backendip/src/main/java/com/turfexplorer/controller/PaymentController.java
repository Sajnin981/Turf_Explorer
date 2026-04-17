package com.turfexplorer.controller;

import com.turfexplorer.dto.PaymentCreateSessionRequest;
import com.turfexplorer.exception.BadRequestException;
import com.turfexplorer.exception.ResourceNotFoundException;
import com.turfexplorer.security.UserDetailsServiceImpl;
import com.turfexplorer.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @PostMapping("/create-bkash-payment")
    public ResponseEntity<Map<String, Object>> createBkashPayment(
            @Valid @RequestBody PaymentCreateSessionRequest request,
            Authentication authentication) {
        try {
            Long userId = getAuthenticatedUserId(authentication);
            return ResponseEntity.ok(paymentService.createBkashPayment(userId, request.getBookingId()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(failedResponse(ex.getMessage()));
        }
    }

    @PostMapping("/execute-bkash-payment")
    public ResponseEntity<Map<String, Object>> executeBkashPayment(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            Long userId = getAuthenticatedUserId(authentication);
            String paymentId = request.get("paymentID");
            return ResponseEntity.ok(paymentService.executeBkashPayment(userId, paymentId));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(failedResponse(ex.getMessage()));
        }
    }

    @PostMapping("/refund/{transactionId}")
    public ResponseEntity<Map<String, Object>> refundBkashPayment(
            @org.springframework.web.bind.annotation.PathVariable Long transactionId,
            Authentication authentication) {
        try {
            Long userId = getAuthenticatedUserId(authentication);
            return ResponseEntity.ok(paymentService.refundBkashPayment(userId, transactionId));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(failedResponse(ex.getMessage()));
        }
    }

    private Long getAuthenticatedUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new BadRequestException("Authentication is required for payment");
        }
        if (userDetailsService.getUserByEmail(authentication.getName()) == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        return userDetailsService.getUserByEmail(authentication.getName()).getId();
    }

    private Map<String, Object> failedResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "FAILED");
        response.put("message", message != null ? message : "Request failed");
        return response;
    }
}
