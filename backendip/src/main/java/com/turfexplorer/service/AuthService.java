package com.turfexplorer.service;

import com.turfexplorer.dto.JwtResponse;
import com.turfexplorer.dto.LoginRequest;
import com.turfexplorer.dto.MessageResponse;
import com.turfexplorer.dto.ResendOtpRequest;
import com.turfexplorer.dto.RegisterRequest;
import com.turfexplorer.dto.VerifyOtpRequest;
import com.turfexplorer.entity.User;
import com.turfexplorer.enums.Role;
import com.turfexplorer.exception.BadRequestException;
import com.turfexplorer.repository.UserRepository;
import com.turfexplorer.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PendingRegistrationService pendingRegistrationService;

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        Optional<User> existingUserOpt = userRepository.findByEmail(normalizedEmail);

        // Allow USER or OWNER registration; ADMIN role cannot be self-assigned
        Role assignedRole = Role.USER;
        if (request.getRole() == Role.OWNER) {
            assignedRole = Role.OWNER;
        }

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (Boolean.TRUE.equals(existingUser.getIsVerified())) {
                throw new BadRequestException("Email already exists");
            }

            // Existing unverified user: refresh account details and issue a new OTP.
            existingUser.setName(request.getName());
            existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
            existingUser.setPhone(request.getPhone());
            existingUser.setAddress(request.getAddress());
            existingUser.setRole(assignedRole);
            existingUser.setIsVerified(false);
            existingUser.setOtp(null);
            existingUser.setOtpExpiry(null);
            userRepository.save(existingUser);
        } else {
            // Brand-new user: create a DB row in unverified state.
            User newUser = new User();
            newUser.setName(request.getName());
            newUser.setEmail(normalizedEmail);
            newUser.setPassword(passwordEncoder.encode(request.getPassword()));
            newUser.setPhone(request.getPhone());
            newUser.setAddress(request.getAddress());
            newUser.setRole(assignedRole);
            newUser.setIsVerified(false);
            newUser.setOtp(null);
            newUser.setOtpExpiry(null);
            userRepository.save(newUser);
        }

        // Always reset stale pending OTP state before issuing a fresh OTP.
        pendingRegistrationService.clearPendingRegistration(normalizedEmail);

        pendingRegistrationService.createOrUpdatePendingRegistration(
                request.getName(),
                normalizedEmail,
                request.getPassword(),
                request.getPhone(),
                request.getAddress(),
                assignedRole
        );

        return new MessageResponse("OTP sent successfully");
    }

    public JwtResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (AuthenticationException ex) {
            throw new BadRequestException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new BadRequestException("Please verify your email first");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return new JwtResponse(jwt, user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getAddress(), user.getRole().name());
    }

    public void verifyOtp(VerifyOtpRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        Optional<User> existingUser = userRepository.findByEmail(normalizedEmail);

        if (existingUser.isPresent() && Boolean.TRUE.equals(existingUser.get().getIsVerified())) {
            throw new BadRequestException("Email already exists");
        }

        User user = pendingRegistrationService.verifyOtpAndBuildUser(
                normalizedEmail,
                request.getOtp(),
                existingUser.orElse(null)
        );
        userRepository.save(user);
    }

    public void resendOtp(ResendOtpRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        Optional<User> existingUser = userRepository.findByEmail(normalizedEmail);

        if (existingUser.isPresent() && Boolean.TRUE.equals(existingUser.get().getIsVerified())) {
            throw new BadRequestException("Email is already registered");
        }

        pendingRegistrationService.resendOtpForPendingRegistration(normalizedEmail);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
