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

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class TurfService {

    @Autowired
    private TurfRepository turfRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private DistanceService distanceService;

    public List<TurfResponse> getAllApprovedTurfs(Double latitude, Double longitude, String search) {
        List<Turf> turfs = getApprovedTurfsByName(search);
        List<TurfResponse> responses = turfs
                .stream()
                .map(turf -> mapToResponse(turf, latitude, longitude))
                .collect(Collectors.toList());

        if (latitude != null && longitude != null) {
            responses.sort(Comparator.comparing(response -> response.getDistanceKm() == null ? Double.MAX_VALUE : response.getDistanceKm()));
        }
        return responses;
    }

    public TurfResponse getTurfById(Long id) {
        Turf turf = turfRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found with id: " + id));
        if (turf.getStatus() != TurfStatus.APPROVED) {
            throw new ResourceNotFoundException("Turf not found with id: " + id);
        }
        return mapToResponse(turf, null, null);
    }

    public List<TurfResponse> getNearbyTurfs(Double latitude, Double longitude, int limit) {
        if (latitude == null || longitude == null) {
            // Fallback to standard listing when coordinates are missing
            return getAllApprovedTurfs(null, null, null);
        }

        int cappedLimit = Math.max(1, Math.min(limit, 50));
        List<TurfResponse> responses = turfRepository.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(TurfStatus.APPROVED)
                .stream()
                .map(turf -> mapToResponse(turf, latitude, longitude))
                .collect(Collectors.toList());

        List<TurfResponse> distanceAware = responses.stream()
                .filter(response -> response.getDistanceKm() != null)
                .sorted(Comparator.comparing(TurfResponse::getDistanceKm))
                .collect(Collectors.toList());

        if (distanceAware.isEmpty()) {
            // Preserve legacy behavior instead of returning an empty list when coordinates are missing in DB
            return getAllApprovedTurfs(null, null, null);
        }

        return distanceAware.stream()
                .limit(cappedLimit)
                .collect(Collectors.toList());
    }

    public List<SlotResponse> getTurfSlots(Long turfId) {
if (!turfRepository.existsById(turfId)) {
    throw new ResourceNotFoundException("Turf not found with id: " + turfId);
}
        
        return slotRepository.findByTurfId(turfId)
                .stream()
                .map(this::mapSlotToResponse)
                .collect(Collectors.toList());
    }

    private List<Turf> getApprovedTurfsByName(String search) {
        if (search == null || search.trim().isEmpty()) {
            return turfRepository.findByStatus(TurfStatus.APPROVED);
        }

        String normalizedSearch = search.trim();
        return turfRepository.findByStatusAndNameContainingIgnoreCase(TurfStatus.APPROVED, normalizedSearch)
                .stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private TurfResponse mapToResponse(Turf turf, Double latitude, Double longitude) {
        TurfResponse response = new TurfResponse();
        response.setId(turf.getId());
        response.setName(turf.getName());
        response.setLocation(turf.getLocation());
        response.setLatitude(turf.getLatitude());
        response.setLongitude(turf.getLongitude());
        response.setTurfType(turf.getTurfType());
        response.setPricePerHour(turf.getPricePerHour());
        response.setDescription(turf.getDescription());
        response.setImageUrl(turf.getImageUrl());
        response.setOwnerId(turf.getOwnerId());
        response.setStatus(turf.getStatus().name());
        response.setCreatedAt(turf.getCreatedAt());
        if (latitude != null && longitude != null) {
            // Distance is only calculated for location-aware calls to avoid unnecessary compute
            response.setDistanceKm(distanceService.calculateDistance(latitude, longitude, turf.getLatitude(), turf.getLongitude()));
        }
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
