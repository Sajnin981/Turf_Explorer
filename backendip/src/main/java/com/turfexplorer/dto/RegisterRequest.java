package com.turfexplorer.dto;

import com.turfexplorer.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String password;

    @Pattern(regexp = "^(\\+?[0-9]{10,15})?$", message = "Phone number must be 10 to 15 digits")
    private String phone;
    
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    // Allows registering as USER or OWNER; defaults to USER if not provided
    private Role role;
}
