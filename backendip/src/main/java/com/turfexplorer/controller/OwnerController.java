package com.turfexplorer.controller;

import com.turfexplorer.dto.*;
import com.turfexplorer.security.UserDetailsServiceImpl;
import com.turfexplorer.service.OwnerService;
import com.turfexplorer.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
public class OwnerController {

    @Autowired
    private OwnerService ownerService;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/turfs")
    public ResponseEntity<TurfResponse> submitTurf(
            @Valid @RequestBody TurfRequest request,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(ownerService.submitTurf(userId, request));
    }

    @GetMapping("/my-turfs")
    public ResponseEntity<List<TurfResponse>> getMyTurfs(Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(ownerService.getMyTurfs(userId));
    }

    @DeleteMapping("/turfs/{id}")
    public ResponseEntity<MessageResponse> deleteTurf(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        ownerService.deleteTurf(id, userId);
        return ResponseEntity.ok(new MessageResponse("Turf deleted successfully"));
    }

    @PostMapping("/turfs/{turfId}/slots")
    public ResponseEntity<SlotResponse> addSlot(
            @PathVariable Long turfId,
            @Valid @RequestBody SlotRequest request,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(ownerService.addSlot(turfId, userId, request));
    }

    @PutMapping("/slots/{slotId}")
    public ResponseEntity<SlotResponse> updateSlot(
            @PathVariable Long slotId,
            @Valid @RequestBody SlotRequest request,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(ownerService.updateSlot(slotId, userId, request));
    }

    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<MessageResponse> deleteSlot(
            @PathVariable Long slotId,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        ownerService.deleteSlot(slotId, userId);
        return ResponseEntity.ok(new MessageResponse("Slot deleted successfully"));
    }

    @GetMapping("/turfs/{turfId}/bookings")
    public ResponseEntity<List<BookingResponse>> getTurfBookings(
            @PathVariable Long turfId,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(ownerService.getTurfBookings(turfId, userId));
    }

    @GetMapping("/turfs/{turfId}/statistics")
    public ResponseEntity<Map<String, Long>> getTurfStatistics(
            @PathVariable Long turfId,
            Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(ownerService.getTurfStatistics(turfId, userId));
    }

    @GetMapping("/earnings-summary")
    public ResponseEntity<OwnerEarningsResponse> getOwnerEarningsSummary(Authentication authentication) {
        Long userId = userDetailsService.getUserByEmail(authentication.getName()).getId();
        return ResponseEntity.ok(paymentService.getOwnerEarningsSummary(userId));
    }
}
