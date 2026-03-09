package com.turfexplorer.service;

import com.turfexplorer.dto.*;
import com.turfexplorer.entity.Booking;
import com.turfexplorer.entity.Slot;
import com.turfexplorer.entity.Turf;
import com.turfexplorer.enums.BookingStatus;
import com.turfexplorer.enums.SlotStatus;
import com.turfexplorer.enums.TurfStatus;
import com.turfexplorer.exception.BadRequestException;
import com.turfexplorer.exception.ResourceNotFoundException;
import com.turfexplorer.repository.BookingRepository;
import com.turfexplorer.repository.SlotRepository;
import com.turfexplorer.repository.TurfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OwnerService {

    @Autowired
    private TurfRepository turfRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public TurfResponse submitTurf(Long userId, TurfRequest request) {
        Turf turf = new Turf();
        turf.setName(request.getName());
        turf.setLocation(request.getLocation());
        turf.setTurfType(request.getTurfType());
        turf.setPricePerHour(request.getPricePerHour());
        turf.setDescription(request.getDescription());
        turf.setImageUrl(request.getImageUrl());
        turf.setOwnerId(userId);
        turf.setStatus(TurfStatus.PENDING);

        turf = turfRepository.save(turf);
        return mapTurfToResponse(turf);
    }

    public List<TurfResponse> getMyTurfs(Long userId) {
        return turfRepository.findByOwnerId(userId)
                .stream()
                .map(this::mapTurfToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteTurf(Long turfId, Long userId) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new BadRequestException("You can only delete your own turfs");
        }

        // Cascade delete associated bookings and slots
        bookingRepository.deleteAll(bookingRepository.findByTurfId(turfId));
        slotRepository.deleteAll(slotRepository.findByTurfId(turfId));
        turfRepository.delete(turf);
    }

    public SlotResponse addSlot(Long turfId, Long userId, SlotRequest request) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new BadRequestException("You can only add slots to your own turfs");
        }

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        Slot slot = new Slot();
        slot.setTurfId(turfId);
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setPrice(request.getPrice());
        slot.setStatus(SlotStatus.AVAILABLE);

        slot = slotRepository.save(slot);
        return mapSlotToResponse(slot);
    }

    public SlotResponse updateSlot(Long slotId, Long userId, SlotRequest request) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        Turf turf = turfRepository.findById(slot.getTurfId())
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new BadRequestException("You can only update slots of your own turfs");
        }

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setPrice(request.getPrice());

        slot = slotRepository.save(slot);
        return mapSlotToResponse(slot);
    }

    @Transactional
    public void deleteSlot(Long slotId, Long userId) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        Turf turf = turfRepository.findById(slot.getTurfId())
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new BadRequestException("You can only delete slots of your own turfs");
        }

        slotRepository.delete(slot);
    }

    public List<BookingResponse> getTurfBookings(Long turfId, Long userId) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new BadRequestException("You can only view bookings of your own turfs");
        }

        return bookingRepository.findByTurfId(turfId)
                .stream()
                .map(booking -> {
                    Slot slot = slotRepository.findById(booking.getSlotId()).orElse(null);
                    return mapBookingToResponse(booking, turf, slot);
                })
                .collect(Collectors.toList());
    }

    public Map<String, Long> getTurfStatistics(Long turfId, Long userId) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new BadRequestException("You can only view statistics of your own turfs");
        }

        Map<String, Long> stats = new HashMap<>();
        stats.put("pending", bookingRepository.findByTurfIdAndStatus(turfId, BookingStatus.PENDING).stream().count());
        stats.put("confirmed", bookingRepository.findByTurfIdAndStatus(turfId, BookingStatus.CONFIRMED).stream().count());
        stats.put("cancelled", bookingRepository.findByTurfIdAndStatus(turfId, BookingStatus.CANCELLED).stream().count());

        return stats;
    }

    private TurfResponse mapTurfToResponse(Turf turf) {
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

    private BookingResponse mapBookingToResponse(Booking booking, Turf turf, Slot slot) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setUserId(booking.getUserId());
        response.setTurfId(booking.getTurfId());
        response.setSlotId(booking.getSlotId());
        response.setBookingDate(booking.getBookingDate());
        response.setStatus(booking.getStatus().name());
        response.setCreatedAt(booking.getCreatedAt());

        if (turf != null) {
            response.setTurfName(turf.getName());
            response.setTurfLocation(turf.getLocation());
        }

        if (slot != null) {
            response.setSlotTime(slot.getStartTime() + " - " + slot.getEndTime());
            response.setPrice(slot.getPrice());
        }

        return response;
    }
}
