package com.turfexplorer.repository;

import com.turfexplorer.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByPaymentId(String paymentId);
    Optional<Transaction> findByTrxId(String trxId);
    Optional<Transaction> findTopByBookingIdOrderByIdDesc(Long bookingId);
    Optional<Transaction> findFirstByBookingIdAndStatusOrderByIdDesc(Long bookingId, com.turfexplorer.enums.TransactionStatus status);
}
