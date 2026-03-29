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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

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
        List<TurfResponse> responses = new ArrayList<>();
        for (Turf turf : turfs) {
            TurfResponse response = mapToResponse(turf, latitude, longitude);
            responses.add(response);
        }

        if (latitude != null && longitude != null) {
            responses.sort(new Comparator<TurfResponse>() {
                @Override
                public int compare(TurfResponse first, TurfResponse second) {
                    double firstDistance = Double.MAX_VALUE;
                    if (first.getDistanceKm() != null) {
                        firstDistance = first.getDistanceKm();
                    }

                    double secondDistance = Double.MAX_VALUE;
                    if (second.getDistanceKm() != null) {
                        secondDistance = second.getDistanceKm();
                    }

                    return Double.compare(firstDistance, secondDistance);
                }
            });
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
        List<Turf> approvedTurfsWithCoordinates = turfRepository.findByStatusAndLatitudeIsNotNullAndLongitudeIsNotNull(TurfStatus.APPROVED);
        List<TurfResponse> responses = new ArrayList<>();
        for (Turf turf : approvedTurfsWithCoordinates) {
            TurfResponse response = mapToResponse(turf, latitude, longitude);
            responses.add(response);
        }

        List<TurfResponse> distanceAware = new ArrayList<>();
        for (TurfResponse response : responses) {
            if (response.getDistanceKm() != null) {
                distanceAware.add(response);
            }
        }

        distanceAware.sort(new Comparator<TurfResponse>() {
            @Override
            public int compare(TurfResponse first, TurfResponse second) {
                return Double.compare(first.getDistanceKm(), second.getDistanceKm());
            }
        });

        if (distanceAware.isEmpty()) {
            // Preserve legacy behavior instead of returning an empty list when coordinates are missing in DB
            return getAllApprovedTurfs(null, null, null);
        }

        List<TurfResponse> limitedResponses = new ArrayList<>();
        for (int index = 0; index < distanceAware.size() && index < cappedLimit; index++) {
            limitedResponses.add(distanceAware.get(index));
        }

        return limitedResponses;
    }

    public List<SlotResponse> getTurfSlots(Long turfId) {
        if (!turfRepository.existsById(turfId)) {
            throw new ResourceNotFoundException("Turf not found with id: " + turfId);
        }

        List<Slot> slots = slotRepository.findByTurfId(turfId);
        List<SlotResponse> slotResponses = new ArrayList<>();
        for (Slot slot : slots) {
            SlotResponse slotResponse = mapSlotToResponse(slot);
            slotResponses.add(slotResponse);
        }

        return slotResponses;
    }

    private List<Turf> getApprovedTurfsByName(String search) {
        if (search == null || search.trim().isEmpty()) {
            return turfRepository.findByStatus(TurfStatus.APPROVED);
        }

        String normalizedSearch = search.trim();
        List<Turf> matchedTurfs = turfRepository.findByStatusAndNameContainingIgnoreCase(TurfStatus.APPROVED, normalizedSearch);
        List<Turf> safeMatchedTurfs = new ArrayList<>();
        for (Turf turf : matchedTurfs) {
            if (turf != null) {
                safeMatchedTurfs.add(turf);
            }
        }

        return safeMatchedTurfs;
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
