package com.turfexplorer.controller;

import com.turfexplorer.dto.BookingRequest;
import com.turfexplorer.dto.BookingResponse;
import com.turfexplorer.dto.MessageResponse;
import com.turfexplorer.security.UserDetailsServiceImpl;
import com.turfexplorer.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(bookingService.createBooking(userId, request));
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(bookingService.getMyBookings(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> cancelBooking(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        bookingService.cancelBooking(id, userId);
        return ResponseEntity.ok(new MessageResponse("Booking cancelled successfully"));
    }
}
