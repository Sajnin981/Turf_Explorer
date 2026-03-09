package com.turfexplorer.repository;

import com.turfexplorer.entity.Booking;
import com.turfexplorer.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByTurfId(Long turfId);
    List<Booking> findBySlotId(Long slotId);
    Optional<Booking> findBySlotIdAndBookingDateAndStatus(Long slotId, LocalDate bookingDate, BookingStatus status);
    List<Booking> findByTurfIdAndStatus(Long turfId, BookingStatus status);
}
