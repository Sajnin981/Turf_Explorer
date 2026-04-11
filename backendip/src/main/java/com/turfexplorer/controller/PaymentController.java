package com.turfexplorer.controller;

import com.turfexplorer.dto.MessageResponse;
import com.turfexplorer.dto.PaymentCreateSessionRequest;
import com.turfexplorer.dto.PaymentCreateSessionResponse;
import com.turfexplorer.dto.PaymentSuccessResponse;
import com.turfexplorer.security.UserDetailsServiceImpl;
import com.turfexplorer.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @PostMapping({"/create-session", "/create-checkout-session"})
    public ResponseEntity<PaymentCreateSessionResponse> createCheckoutSession(
            @Valid @RequestBody PaymentCreateSessionRequest request,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(paymentService.createCheckoutSession(userId, request.getBookingId()));
    }

    @PostMapping("/webhook")
    public ResponseEntity<MessageResponse> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String stripeSignature) {
        paymentService.handleWebhook(payload, stripeSignature);
        return ResponseEntity.ok(new MessageResponse("Webhook processed"));
    }

    @PostMapping("/success")
    public ResponseEntity<PaymentSuccessResponse> confirmPaymentSuccess(
            @RequestParam String session_id) {
        log.info("Received payment success callback with session_id={}", session_id);
        return ResponseEntity.ok(paymentService.confirmPaymentSuccess(session_id));
    }
}
