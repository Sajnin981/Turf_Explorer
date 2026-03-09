package com.turfexplorer.controller;

import com.turfexplorer.dto.TurfResponse;
import com.turfexplorer.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/pending-turfs")
    public ResponseEntity<List<TurfResponse>> getPendingTurfs() {
        return ResponseEntity.ok(adminService.getPendingTurfs());
    }

    @GetMapping("/approved-turfs")
    public ResponseEntity<List<TurfResponse>> getApprovedTurfs() {
        return ResponseEntity.ok(adminService.getApprovedTurfs());
    }

    @PutMapping("/approve/{turfId}")
    public ResponseEntity<TurfResponse> approveTurf(@PathVariable Long turfId) {
        return ResponseEntity.ok(adminService.approveTurf(turfId));
    }

    @PutMapping("/reject/{turfId}")
    public ResponseEntity<TurfResponse> rejectTurf(@PathVariable Long turfId) {
        return ResponseEntity.ok(adminService.rejectTurf(turfId));
    }
}
