package com.turfexplorer.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionSchemaCompatibilityInitializer {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureTransactionSchemaCompatibility() {
        try {
            if (!transactionsTableExists()) {
                return;
            }

            ensureStripeSessionIdColumnExists();
            ensureStripeSessionIdIsNullable();
            ensureRefundedStatusExists();
        } catch (Exception ex) {
            // Keep app startup resilient; refund API will still surface explicit errors if DB permissions block DDL.
            log.error("Failed to ensure transaction schema compatibility", ex);
        }
    }

    private boolean transactionsTableExists() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                  AND table_name = 'transactions'
                """,
                Integer.class
        );
        return count != null && count > 0;
    }

    private void ensureStripeSessionIdColumnExists() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'transactions'
                  AND column_name = 'stripe_session_id'
                """,
                Integer.class
        );

        if (count != null && count > 0) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE transactions ADD COLUMN stripe_session_id VARCHAR(255) NULL AFTER payment_id");
        log.info("Applied schema compatibility fix: added transactions.stripe_session_id");
    }

    private void ensureStripeSessionIdIsNullable() {
        String isNullable = jdbcTemplate.queryForObject(
                """
                SELECT is_nullable
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'transactions'
                  AND column_name = 'stripe_session_id'
                LIMIT 1
                """,
                String.class
        );

        if (isNullable == null || "YES".equalsIgnoreCase(isNullable)) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE transactions MODIFY COLUMN stripe_session_id VARCHAR(255) NULL");
        log.info("Applied schema compatibility fix: changed transactions.stripe_session_id to NULLABLE");
    }

    private void ensureRefundedStatusExists() {
        String columnType = jdbcTemplate.queryForObject(
                """
                SELECT column_type
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'transactions'
                  AND column_name = 'status'
                LIMIT 1
                """,
                String.class
        );

        if (columnType != null && columnType.toLowerCase().contains("refunded")) {
            return;
        }

        jdbcTemplate.execute(
                "ALTER TABLE transactions MODIFY COLUMN status ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING'"
        );
        log.info("Applied schema compatibility fix: updated transactions.status enum with REFUNDED");
    }
}
