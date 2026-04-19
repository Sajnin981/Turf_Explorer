package com.turfexplorer.service;

import com.turfexplorer.entity.Booking;
import com.turfexplorer.entity.Transaction;
import com.turfexplorer.enums.BookingStatus;
import com.turfexplorer.enums.TransactionStatus;
import com.turfexplorer.repository.BookingRepository;
import com.turfexplorer.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AbandonedBookingCleanupService {

    private static final Logger log = LoggerFactory.getLogger(AbandonedBookingCleanupService.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Value("${cleanup.abandoned-booking.cutoff-minutes:15}")
    private long cutoffMinutes;

    @Scheduled(fixedDelayString = "${cleanup.abandoned-booking.fixed-delay-ms:300000}")
    @Transactional
    public void cleanupAbandonedPendingBookings() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(cutoffMinutes);
        List<Booking> stalePendingBookings = bookingRepository.findByStatusAndCreatedAtBefore(BookingStatus.PENDING, cutoffTime);

        int cancelledBookings = 0;
        int failedTransactions = 0;

        for (Booking booking : stalePendingBookings) {
            Transaction latestTransaction = transactionRepository
                    .findTopByBookingIdOrderByIdDesc(booking.getId())
                    .orElse(null);

            if (latestTransaction != null && latestTransaction.getStatus() != TransactionStatus.PENDING) {
                continue;
            }

            if (latestTransaction != null
                    && latestTransaction.getCreatedAt() != null
                    && latestTransaction.getCreatedAt().isAfter(cutoffTime)) {
                continue;
            }

            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
            cancelledBookings++;

            if (latestTransaction != null) {
                latestTransaction.setStatus(TransactionStatus.FAILED);
                transactionRepository.save(latestTransaction);
                failedTransactions++;
            }
        }

        if (cancelledBookings > 0 || failedTransactions > 0) {
            log.info("Abandoned booking cleanup completed. cancelledBookings={} failedTransactions={} cutoffMinutes={}",
                    cancelledBookings,
                    failedTransactions,
                    cutoffMinutes);
        }
    }
}
