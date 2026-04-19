package com.turfexplorer.service;

import com.turfexplorer.dto.*;
import com.turfexplorer.entity.Booking;
import com.turfexplorer.entity.Slot;
import com.turfexplorer.entity.Turf;
import com.turfexplorer.entity.Transaction;
import com.turfexplorer.enums.BookingStatus;
import com.turfexplorer.enums.TransactionStatus;
import com.turfexplorer.enums.TurfStatus;
import com.turfexplorer.exception.BadRequestException;
import com.turfexplorer.exception.ResourceNotFoundException;
import com.turfexplorer.repository.BookingRepository;
import com.turfexplorer.repository.SlotRepository;
import com.turfexplorer.repository.TurfRepository;
import com.turfexplorer.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class OwnerService {

    @Autowired
    private TurfRepository turfRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    public TurfResponse submitTurf(Long userId, TurfRequest request) {
        Turf turf = new Turf();
        turf.setName(request.getName());
        turf.setLocation(request.getLocation());
        // Persist coordinates when owners provide them so discovery APIs can work
        turf.setLatitude(request.getLatitude());
        turf.setLongitude(request.getLongitude());
        turf.setTurfType(request.getTurfType());
        turf.setPricePerHour(request.getPricePerHour());
        turf.setDescription(request.getDescription());
        turf.setImageUrl(request.getImageUrl());
        turf.setOwnerId(userId);
        turf.setAvailable(request.getAvailable() == null ? Boolean.TRUE : request.getAvailable());
        turf.setStatus(TurfStatus.PENDING);

        turf = turfRepository.save(turf);
        return mapTurfToResponse(turf);
    }

    public List<TurfResponse> getMyTurfs(Long userId) {
        List<Turf> myTurfs = turfRepository.findByOwnerId(userId);
        List<TurfResponse> turfResponses = new ArrayList<>();
        for (Turf turf : myTurfs) {
            TurfResponse turfResponse = mapTurfToResponse(turf);
            turfResponses.add(turfResponse);
        }

        return turfResponses;
    }

    @Transactional
    public void deleteTurf(Long turfId, Long userId) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new AccessDeniedException("You can only delete your own turfs");
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
            throw new AccessDeniedException("You can only add slots to your own turfs");
        }

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        validateSlotOverlap(turfId, request.getStartTime(), request.getEndTime(), null);

        Slot slot = new Slot();
        slot.setTurfId(turfId);
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setPrice(request.getPrice());

        slot = slotRepository.save(slot);
        return mapSlotToResponse(slot);
    }

    public SlotResponse updateSlot(Long slotId, Long userId, SlotRequest request) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        Turf turf = turfRepository.findById(slot.getTurfId())
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new AccessDeniedException("You can only update slots of your own turfs");
        }

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        boolean hasActiveBookings = hasActiveBookings(slotId);
        boolean timeChanged = !slot.getStartTime().equals(request.getStartTime())
                || !slot.getEndTime().equals(request.getEndTime());

        if (hasActiveBookings && timeChanged) {
            throw new BadRequestException("This slot already has active bookings, so start/end time cannot be changed");
        }

        validateSlotOverlap(slot.getTurfId(), request.getStartTime(), request.getEndTime(), slot.getId());

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
            throw new AccessDeniedException("You can only delete slots of your own turfs");
        }

        if (hasActiveBookings(slotId)) {
            throw new BadRequestException("Cannot delete slot because it has active bookings");
        }

        slotRepository.delete(slot);
    }

    private boolean hasActiveBookings(Long slotId) {
        return bookingRepository.existsBySlotIdAndStatusIn(
                slotId,
                Arrays.asList(BookingStatus.PENDING, BookingStatus.CONFIRMED)
        );
    }

    private void validateSlotOverlap(Long turfId, LocalTime startTime, LocalTime endTime, Long excludeSlotId) {
        List<Slot> existingSlots;
        if (excludeSlotId == null) {
            existingSlots = slotRepository.findByTurfId(turfId);
        } else {
            existingSlots = slotRepository.findByTurfIdAndIdNot(turfId, excludeSlotId);
        }

        boolean overlaps = false;
        for (Slot existing : existingSlots) {
            boolean startsBeforeExistingEnds = startTime.isBefore(existing.getEndTime());
            boolean endsAfterExistingStarts = endTime.isAfter(existing.getStartTime());
            if (startsBeforeExistingEnds && endsAfterExistingStarts) {
                overlaps = true;
                break;
            }
        }

        if (overlaps) {
            throw new BadRequestException("Slot overlaps with an existing slot for this turf");
        }
    }

    public List<BookingResponse> getTurfBookings(Long turfId, Long userId) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new AccessDeniedException("You can only view bookings of your own turfs");
        }

        List<Booking> turfBookings = bookingRepository.findByTurfId(turfId);
        List<BookingResponse> bookingResponses = new ArrayList<>();
        for (Booking booking : turfBookings) {
            Slot slot = slotRepository.findById(booking.getSlotId()).orElse(null);
            BookingResponse bookingResponse = mapBookingToResponse(booking, turf, slot);
            bookingResponses.add(bookingResponse);
        }

        return bookingResponses;
    }

    public TurfResponse updateTurfAvailability(Long turfId, Long userId, Boolean available) {
        Turf turf = turfRepository.findById(turfId)
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        if (!turf.getOwnerId().equals(userId)) {
            throw new AccessDeniedException("You can only update your own turfs");
        }

        if (available == null) {
            throw new BadRequestException("Availability is required");
        }

        turf.setAvailable(available);
        turf = turfRepository.save(turf);
        return mapTurfToResponse(turf);
    }

    private TurfResponse mapTurfToResponse(Turf turf) {
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
        response.setAvailable(turf.getAvailable());
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
        response.setCreatedAt(slot.getCreatedAt());
        return response;
    }

    private BookingResponse mapBookingToResponse(Booking booking, Turf turf, Slot slot) {
        BookingResponse response = new BookingResponse();
        java.util.Optional<Transaction> selectedTransaction = resolveTransactionRecord(booking.getId());
        response.setId(booking.getId());
        response.setTransactionId(selectedTransaction.map(Transaction::getId).orElse(null));
        response.setPaymentId(selectedTransaction.map(Transaction::getPaymentId).orElse(null));
        response.setTrxId(selectedTransaction.map(Transaction::getTrxId).orElse(null));
        response.setTransactionAmount(selectedTransaction.map(Transaction::getAmount).orElse(null));
        response.setUserId(booking.getUserId());
        response.setTurfId(booking.getTurfId());
        response.setSlotId(booking.getSlotId());
        response.setBookingDate(booking.getBookingDate());
        response.setStatus(booking.getStatus().name());
        TransactionStatus transactionStatus = selectedTransaction
            .map(Transaction::getStatus)
            .orElse(TransactionStatus.PENDING);
        response.setTransactionStatus(transactionStatus.name());
        response.setPaymentStatus(mapPaymentStatus(transactionStatus));
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

    private java.util.Optional<Transaction> resolveTransactionRecord(Long bookingId) {
        return transactionRepository
            .findFirstByBookingIdAndStatusOrderByIdDesc(bookingId, TransactionStatus.REFUNDED)
            .or(() -> transactionRepository.findFirstByBookingIdAndStatusOrderByIdDesc(bookingId, TransactionStatus.SUCCESS))
            .or(() -> transactionRepository.findFirstByBookingIdAndStatusOrderByIdDesc(bookingId, TransactionStatus.FAILED))
            .or(() -> transactionRepository.findTopByBookingIdOrderByIdDesc(bookingId));
    }

    private TransactionStatus resolveTransactionStatus(Long bookingId) {
        return resolveTransactionRecord(bookingId)
                .map(Transaction::getStatus)
                .orElse(TransactionStatus.PENDING);
    }

    private String mapPaymentStatus(TransactionStatus transactionStatus) {
        if (transactionStatus == TransactionStatus.REFUNDED) {
            return "REFUNDED";
        }
        if (transactionStatus == TransactionStatus.SUCCESS) {
            return "PAID";
        }
        if (transactionStatus == TransactionStatus.FAILED) {
            return "FAILED";
        }
        return "PENDING";
    }
}
