package com.turfexplorer.service;

import com.turfexplorer.entity.User;
import com.turfexplorer.enums.Role;
import com.turfexplorer.exception.BadRequestException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PendingRegistrationService {

    private static final int OTP_EXPIRE_MINUTES = 5;
    private static final int OTP_LENGTH = 6;

    private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom;

    public PendingRegistrationService(PasswordEncoder passwordEncoder, EmailService emailService) {
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.secureRandom = new SecureRandom();
    }

    public void createOrUpdatePendingRegistration(String name,
                                                  String email,
                                                  String password,
                                                  String phone,
                                                  String address,
                                                  Role role) {
        String normalizedEmail = normalizeEmail(email);
        String otp = generateOtp();

        PendingRegistration pendingRegistration = new PendingRegistration(
                name,
                normalizedEmail,
                passwordEncoder.encode(password),
                phone,
                address,
                role,
                passwordEncoder.encode(otp),
                LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES)
        );

        pendingRegistrations.put(normalizedEmail, pendingRegistration);
        emailService.sendOtpEmail(normalizedEmail, otp);
    }

    public void clearPendingRegistration(String email) {
        String normalizedEmail = normalizeEmail(email);
        pendingRegistrations.remove(normalizedEmail);
    }

    public User verifyOtpAndBuildUser(String email, String otp, User existingUser) {
        String normalizedEmail = normalizeEmail(email);
        PendingRegistration pendingRegistration = pendingRegistrations.get(normalizedEmail);

        if (pendingRegistration == null) {
            throw new BadRequestException("Registration not found. Please register first");
        }

        if (LocalDateTime.now().isAfter(pendingRegistration.otpExpiry())) {
            throw new BadRequestException("OTP has expired. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(otp, pendingRegistration.otpHash())) {
            throw new BadRequestException("Invalid OTP");
        }

        pendingRegistrations.remove(normalizedEmail);

        User user = existingUser != null ? existingUser : new User();
        user.setName(pendingRegistration.name());
        user.setEmail(pendingRegistration.email());
        user.setPassword(pendingRegistration.passwordHash());
        user.setPhone(pendingRegistration.phone());
        user.setAddress(pendingRegistration.address());
        user.setRole(pendingRegistration.role());
        user.setIsVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        return user;
    }

    public void resendOtpForPendingRegistration(String email) {
        String normalizedEmail = normalizeEmail(email);
        PendingRegistration existing = pendingRegistrations.get(normalizedEmail);

        if (existing == null) {
            throw new BadRequestException("No pending registration found for this email");
        }

        String newOtp = generateOtp();
        PendingRegistration updated = new PendingRegistration(
                existing.name(),
                existing.email(),
                existing.passwordHash(),
                existing.phone(),
                existing.address(),
                existing.role(),
                passwordEncoder.encode(newOtp),
                LocalDateTime.now().plusMinutes(OTP_EXPIRE_MINUTES)
        );

        pendingRegistrations.put(normalizedEmail, updated);
        emailService.sendOtpEmail(normalizedEmail, newOtp);
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

    private record PendingRegistration(
            String name,
            String email,
            String passwordHash,
            String phone,
            String address,
            Role role,
            String otpHash,
            LocalDateTime otpExpiry
    ) {
    }
}
