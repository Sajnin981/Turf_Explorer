package com.turfexplorer.controller;

import com.turfexplorer.dto.UserProfileDto;
import com.turfexplorer.entity.User;
import com.turfexplorer.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getMe(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(new UserProfileDto(user.getName(), user.getEmail(), user.getPhone(), user.getAddress()));
    }

    @PutMapping("/me")
    @Transactional
    public ResponseEntity<UserProfileDto> updateMe(Authentication authentication, @Valid @RequestBody UserProfileDto dto) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        
        if (dto.getName() != null && !dto.getName().isEmpty()) {
            user.setName(dto.getName());
        }
        user.setPhone(dto.getPhone());
        user.setAddress(dto.getAddress());
        
        userRepository.save(user);
        return ResponseEntity.ok(new UserProfileDto(user.getName(), user.getEmail(), user.getPhone(), user.getAddress()));
    }
}
