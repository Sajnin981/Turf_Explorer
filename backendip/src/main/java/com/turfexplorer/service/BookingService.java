package com.turfexplorer.service;

import com.turfexplorer.dto.BookingRequest;
import com.turfexplorer.dto.BookingResponse;
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

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TurfRepository turfRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Transactional
    public BookingResponse createBooking(Long userId, BookingRequest request) {
        // Verify turf exists
        Turf turf = turfRepository.findById(request.getTurfId())
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        // Check that turf is approved and available for booking
        if (turf.getStatus() != TurfStatus.APPROVED) {
            throw new BadRequestException("Turf is not available for booking");
        }

        // Verify slot exists
        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        // Check if slot belongs to turf
        if (!slot.getTurfId().equals(request.getTurfId())) {
            throw new BadRequestException("Slot does not belong to this turf");
        }

        // Check if slot is available
        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new BadRequestException("Slot is not available");
        }

        // Check if slot is already booked for this date
        if (bookingRepository.findBySlotIdAndBookingDateAndStatus(
                request.getSlotId(), request.getBookingDate(), BookingStatus.CONFIRMED).isPresent()) {
            throw new BadRequestException("Slot is already booked for this date");
        }

        // Create booking
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setTurfId(request.getTurfId());
        booking.setSlotId(request.getSlotId());
        booking.setBookingDate(request.getBookingDate());
        booking.setStatus(BookingStatus.CONFIRMED);

        booking = bookingRepository.save(booking);

        return mapToResponse(booking, turf, slot);
    }

    public List<BookingResponse> getMyBookings(Long userId) {
        return bookingRepository.findByUserId(userId)
                .stream()
                .map(booking -> {
                    Turf turf = turfRepository.findById(booking.getTurfId()).orElse(null);
                    Slot slot = slotRepository.findById(booking.getSlotId()).orElse(null);
                    return mapToResponse(booking, turf, slot);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new BadRequestException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    private BookingResponse mapToResponse(Booking booking, Turf turf, Slot slot) {
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
