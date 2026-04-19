package com.turfexplorer.controller;

import com.turfexplorer.dto.JwtResponse;
import com.turfexplorer.dto.LoginRequest;
import com.turfexplorer.dto.MessageResponse;
import com.turfexplorer.dto.ForgotPasswordRequest;
import com.turfexplorer.dto.ResetPasswordRequest;
import com.turfexplorer.dto.ResendOtpRequest;
import com.turfexplorer.dto.RegisterRequest;
import com.turfexplorer.dto.VerifyResetOtpRequest;
import com.turfexplorer.dto.VerifyOtpRequest;
import com.turfexplorer.service.AuthService;
import com.turfexplorer.service.AuthRateLimiterService;
import com.turfexplorer.service.PasswordResetService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private AuthRateLimiterService authRateLimiterService;

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        authRateLimiterService.assertRegisterAllowed(resolveClientId(httpRequest), request.getEmail());
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        authRateLimiterService.assertLoginAllowed(resolveClientId(httpRequest), request.getEmail());
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<MessageResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request, HttpServletRequest httpRequest) {
        authRateLimiterService.assertVerifyOtpAllowed(resolveClientId(httpRequest), request.getEmail());
        authService.verifyOtp(request);
        return ResponseEntity.ok(new MessageResponse("OTP verified successfully"));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<MessageResponse> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendOtp(request);
        return ResponseEntity.ok(new MessageResponse("OTP sent successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.forgotPassword(request.getEmail()));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<MessageResponse> verifyResetOtp(@Valid @RequestBody VerifyResetOtpRequest request) {
        return ResponseEntity.ok(passwordResetService.verifyResetOtp(request.getEmail(), request.getOtp()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.resetPassword(request.getEmail(), request.getNewPassword()));
    }

    @PostMapping("/resend-reset-otp")
    public ResponseEntity<MessageResponse> resendResetOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.resendResetOtp(request.getEmail()));
    }

    private String resolveClientId(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String[] forwardedValues = forwardedFor.split(",");
            String first = forwardedValues.length > 0 ? forwardedValues[0].trim() : "";
            if (!first.isBlank()) {
                return first;
            }
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr != null && !remoteAddr.isBlank()) {
            return remoteAddr;
        }

        return "unknown";
    }
}
