package com.turfexplorer.service;

import com.turfexplorer.dto.TurfResponse;
import com.turfexplorer.entity.Turf;
import com.turfexplorer.enums.TurfStatus;
import com.turfexplorer.exception.ResourceNotFoundException;
import com.turfexplorer.repository.TurfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private TurfRepository turfRepository;

    public List<TurfResponse> getPendingTurfs() {
        return turfRepository.findByStatus(TurfStatus.PENDING)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TurfResponse> getApprovedTurfs() {
        return turfRepository.findByStatus(TurfStatus.APPROVED)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TurfResponse approveTurf(Long turfId) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        turf.setStatus(TurfStatus.APPROVED);
        turf = turfRepository.save(turf);

        return mapToResponse(turf);
    }

    @Transactional
    public TurfResponse rejectTurf(Long turfId) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        turf.setStatus(TurfStatus.REJECTED);
        turf = turfRepository.save(turf);

        return mapToResponse(turf);
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
}
