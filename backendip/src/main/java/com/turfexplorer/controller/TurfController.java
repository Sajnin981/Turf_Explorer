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
    public ResponseEntity<List<TurfResponse>> getAllTurfs() {
        return ResponseEntity.ok(turfService.getAllApprovedTurfs());
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
