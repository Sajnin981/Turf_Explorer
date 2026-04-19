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

            ensureTrxIdColumnExists();
            backfillTrxIdFromLegacyStripeColumn();
            ensureTrxIdIndex();
            dropLegacyStripeSessionIdColumn();
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

    private void ensureTrxIdColumnExists() {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'transactions'
                  AND column_name = 'trx_id'
                """,
                Integer.class
        );

        if (count != null && count > 0) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE transactions ADD COLUMN trx_id VARCHAR(255) NULL AFTER payment_id");
        log.info("Applied schema compatibility fix: added transactions.trx_id");
    }

    private void backfillTrxIdFromLegacyStripeColumn() {
        Integer hasLegacyStripeColumn = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'transactions'
                  AND column_name = 'stripe_session_id'
                """,
                Integer.class
        );

        if (hasLegacyStripeColumn == null || hasLegacyStripeColumn == 0) {
            return;
        }

        jdbcTemplate.execute("UPDATE transactions SET trx_id = stripe_session_id WHERE trx_id IS NULL AND stripe_session_id IS NOT NULL");
        log.info("Applied schema compatibility fix: backfilled transactions.trx_id from legacy stripe_session_id");
    }

    private void ensureTrxIdIndex() {
        try {
            Integer indexCount = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*)
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'transactions'
                      AND index_name = 'ux_transactions_trx_id'
                    """,
                    Integer.class
            );

            if (indexCount != null && indexCount > 0) {
                return;
            }

            jdbcTemplate.execute("CREATE UNIQUE INDEX ux_transactions_trx_id ON transactions(trx_id)");
            log.info("Applied schema compatibility fix: added unique index on transactions.trx_id");
        } catch (Exception ex) {
            log.warn("Could not create unique index on transactions.trx_id. Continuing startup.", ex);
        }
    }

    private void dropLegacyStripeSessionIdColumn() {
        Integer hasLegacyStripeColumn = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = 'transactions'
                  AND column_name = 'stripe_session_id'
                """,
                Integer.class
        );

        if (hasLegacyStripeColumn == null || hasLegacyStripeColumn == 0) {
            return;
        }

        jdbcTemplate.execute("ALTER TABLE transactions DROP COLUMN stripe_session_id");
        log.info("Applied schema compatibility fix: dropped legacy transactions.stripe_session_id");
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
