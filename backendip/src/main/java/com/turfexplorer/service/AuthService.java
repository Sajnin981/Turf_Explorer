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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        // Allow USER or OWNER registration; ADMIN role cannot be self-assigned
        Role assignedRole = Role.USER;
        if (request.getRole() == Role.OWNER) {
            assignedRole = Role.OWNER;
        }

        pendingRegistrationService.createOrUpdatePendingRegistration(
                request.getName(),
                request.getEmail(),
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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = pendingRegistrationService.verifyOtpAndBuildUser(request.getEmail(), request.getOtp());
        userRepository.save(user);
    }

    public void resendOtp(ResendOtpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        pendingRegistrationService.resendOtpForPendingRegistration(request.getEmail());
    }
}
