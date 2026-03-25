package com.turfexplorer.controller;

import com.turfexplorer.dto.SlotResponse;
import com.turfexplorer.dto.TurfResponse;
import com.turfexplorer.service.TurfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/turfs")
public class TurfController {

    @Autowired
    private TurfService turfService;

    @GetMapping
    public ResponseEntity<List<TurfResponse>> getAllTurfs(
            @RequestParam(value = "lat", required = false) Double latitude,
            @RequestParam(value = "lng", required = false) Double longitude) {
        return ResponseEntity.ok(turfService.getAllApprovedTurfs(latitude, longitude));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<TurfResponse>> getNearbyTurfs(
            @RequestParam("lat") Double latitude,
            @RequestParam("lng") Double longitude,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        // Dedicated endpoint that always sorts by proximity and caps the page size
        return ResponseEntity.ok(turfService.getNearbyTurfs(latitude, longitude, limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TurfResponse> getTurfById(@PathVariable Long id) {
        return ResponseEntity.ok(turfService.getTurfById(id));
    }

    @GetMapping("/{id}/slots")
    public ResponseEntity<List<SlotResponse>> getTurfSlots(@PathVariable Long id) {
        return ResponseEntity.ok(turfService.getTurfSlots(id));
    }
}
