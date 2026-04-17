package com.turfexplorer.service;

import com.turfexplorer.dto.BookingRequest;
import com.turfexplorer.dto.BookingResponse;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TurfRepository turfRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Transactional
    public BookingResponse createBooking(Long userId, BookingRequest request) {
        // Verify turf exists
        Turf turf = turfRepository.findById(request.getTurfId())
                .orElseThrow(() -> new ResourceNotFoundException("Turf not found"));

        // Check that turf is approved and open for booking
        if (turf.getStatus() != TurfStatus.APPROVED) {
            throw new BadRequestException("Turf is not available for booking");
        }

        if (!Boolean.TRUE.equals(turf.getAvailable())) {
            throw new BadRequestException("Turf is currently unavailable for booking");
        }

        // Verify slot exists
        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        // Check if slot belongs to turf
        if (!slot.getTurfId().equals(request.getTurfId())) {
            throw new BadRequestException("Slot does not belong to this turf");
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
        booking.setStatus(BookingStatus.PENDING);

        booking = bookingRepository.save(booking);

        return mapToResponse(booking, turf, slot);
    }

    public List<BookingResponse> getMyBookings(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        List<BookingResponse> bookingResponses = new ArrayList<>();

        for (Booking booking : bookings) {
            Turf turf = turfRepository.findById(booking.getTurfId()).orElse(null);
            Slot slot = slotRepository.findById(booking.getSlotId()).orElse(null);
            BookingResponse response = mapToResponse(booking, turf, slot);
            bookingResponses.add(response);
        }

        return bookingResponses;
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

        Transaction transactionBeforeCancel = transactionRepository
            .findTopByBookingIdOrderByIdDesc(booking.getId())
            .orElse(null);

        String transactionStatusBefore = transactionBeforeCancel != null
            ? transactionBeforeCancel.getStatus().name()
            : "NONE";

        log.info("Cancelling bookingId={} currentBookingStatus={} transactionStatusBefore={}",
            booking.getId(), booking.getStatus(), transactionStatusBefore);

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        String transactionStatusAfter = transactionRepository
            .findTopByBookingIdOrderByIdDesc(booking.getId())
            .map(Transaction::getStatus)
            .map(Enum::name)
            .orElse("NONE");

        log.info("Booking cancelled bookingId={} newBookingStatus={} transactionStatusAfter={} (unchanged expected)",
            booking.getId(), booking.getStatus(), transactionStatusAfter);
    }

    @Transactional
    public BookingResponse confirmBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new BadRequestException("You can only confirm your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cancelled bookings cannot be confirmed");
        }

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            Turf turf = turfRepository.findById(booking.getTurfId()).orElse(null);
            Slot slot = slotRepository.findById(booking.getSlotId()).orElse(null);
            return mapToResponse(booking, turf, slot);
        }

        if (bookingRepository.findBySlotIdAndBookingDateAndStatus(
                booking.getSlotId(), booking.getBookingDate(), BookingStatus.CONFIRMED).isPresent()) {
            throw new BadRequestException("Slot is already booked for this date");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);

        Turf turf = turfRepository.findById(booking.getTurfId()).orElse(null);
        Slot slot = slotRepository.findById(booking.getSlotId()).orElse(null);
        return mapToResponse(booking, turf, slot);
    }

    private BookingResponse mapToResponse(Booking booking, Turf turf, Slot slot) {
        BookingResponse response = new BookingResponse();
        java.util.Optional<Transaction> selectedTransaction = resolveTransactionRecord(booking.getId());
        response.setId(booking.getId());
        response.setTransactionId(selectedTransaction.map(Transaction::getId).orElse(null));
        response.setPaymentId(selectedTransaction.map(Transaction::getPaymentId).orElse(null));
        response.setTrxId(selectedTransaction.map(Transaction::getStripeSessionId).orElse(null));
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
