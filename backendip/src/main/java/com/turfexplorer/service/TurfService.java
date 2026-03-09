package com.turfexplorer.service;

import com.turfexplorer.dto.SlotResponse;
import com.turfexplorer.dto.TurfResponse;
import com.turfexplorer.entity.Slot;
import com.turfexplorer.entity.Turf;
import com.turfexplorer.enums.TurfStatus;
import com.turfexplorer.exception.ResourceNotFoundException;
import com.turfexplorer.repository.SlotRepository;
import com.turfexplorer.repository.TurfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TurfService {

    @Autowired
    private TurfRepository turfRepository;

    @Autowired
    private SlotRepository slotRepository;

    public List<TurfResponse> getAllApprovedTurfs() {
        return turfRepository.findByStatus(TurfStatus.APPROVED)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TurfResponse getTurfById(Long id) {
        Turf turf = turfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found with id: " + id));
        if (turf.getStatus() != TurfStatus.APPROVED) {
            throw new ResourceNotFoundException("Turf not found with id: " + id);
        }
        return mapToResponse(turf);
    }

    public List<SlotResponse> getTurfSlots(Long turfId) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found with id: " + turfId));
        
        return slotRepository.findByTurfId(turfId)
                .stream()
                .map(this::mapSlotToResponse)
                .collect(Collectors.toList());
    }

    private TurfResponse mapToResponse(Turf turf) {
        TurfResponse response = new TurfResponse();
        response.setId(turf.getId());
        response.setName(turf.getName());
        response.setLocation(turf.getLocation());
        response.setTurfType(turf.getTurfType());
        response.setPricePerHour(turf.getPricePerHour());
        response.setDescription(turf.getDescription());
        response.setImageUrl(turf.getImageUrl());
        response.setOwnerId(turf.getOwnerId());
        response.setStatus(turf.getStatus().name());
        response.setCreatedAt(turf.getCreatedAt());
        return response;
    }

    private SlotResponse mapSlotToResponse(Slot slot) {
        SlotResponse response = new SlotResponse();
        response.setId(slot.getId());
        response.setTurfId(slot.getTurfId());
        response.setStartTime(slot.getStartTime());
        response.setEndTime(slot.getEndTime());
        response.setPrice(slot.getPrice());
        response.setStatus(slot.getStatus().name());
        response.setCreatedAt(slot.getCreatedAt());
        return response;
    }
}
