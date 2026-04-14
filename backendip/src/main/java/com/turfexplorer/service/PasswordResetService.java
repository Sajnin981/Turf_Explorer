package com.turfexplorer.service;

import com.turfexplorer.dto.MessageResponse;
import com.turfexplorer.entity.User;
import com.turfexplorer.exception.BadRequestException;
import com.turfexplorer.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRE_MINUTES = 5;
    private static final int RESET_VERIFIED_EXPIRE_MINUTES = 10;

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom;
    private final Map<String, LocalDateTime> verifiedResetRequests;

    public PasswordResetService(UserRepository userRepository,
                                EmailService emailService,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.secureRandom = new SecureRandom();
        this.verifiedResetRequests = new ConcurrentHashMap<>();
    }

    public MessageResponse forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            String otp = generateOtp();
            user.setResetOtp(passwordEncoder.encode(otp));
            user.setResetOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES));
            userRepository.save(user);
            emailService.sendPasswordResetOtpEmail(user.getEmail(), otp);
        });

        verifiedResetRequests.remove(normalizedEmail);
        return new MessageResponse("If an account with that email exists, an OTP has been sent.");
    }

    public MessageResponse verifyResetOtp(String email, String otp) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new BadRequestException("Invalid or expired OTP"));

        if (user.getResetOtp() == null || user.getResetOtpExpiry() == null) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        if (LocalDateTime.now().isAfter(user.getResetOtpExpiry())) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        if (!passwordEncoder.matches(otp, user.getResetOtp())) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        verifiedResetRequests.put(normalizeEmail(email), LocalDateTime.now().plusMinutes(RESET_VERIFIED_EXPIRE_MINUTES));
        return new MessageResponse("Reset OTP verified successfully");
    }

    public MessageResponse resetPassword(String email, String newPassword) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Unable to reset password"));

        LocalDateTime verifiedUntil = verifiedResetRequests.get(normalizedEmail);
        if (verifiedUntil == null || LocalDateTime.now().isAfter(verifiedUntil)) {
            verifiedResetRequests.remove(normalizedEmail);
            throw new BadRequestException("OTP verification required before resetting password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetOtp(null);
        user.setResetOtpExpiry(null);
        userRepository.save(user);

        verifiedResetRequests.remove(normalizedEmail);
        return new MessageResponse("Password reset successfully");
    }

    public MessageResponse resendResetOtp(String email) {
        return forgotPassword(email);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String generateOtp() {
        int max = (int) Math.pow(10, OTP_LENGTH);
        int min = max / 10;
        int randomNumber = secureRandom.nextInt(max - min) + min;
        return String.valueOf(randomNumber);
    }
}
