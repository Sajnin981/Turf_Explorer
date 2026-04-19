-- Turf Explorer migration: replace legacy stripe_session_id with trx_id
-- 1) Add trx_id column if missing
-- 2) Backfill trx_id from stripe_session_id
-- 3) Add unique index on trx_id
-- 4) Drop legacy stripe_session_id column

SET @db_name = COALESCE(DATABASE(), 'turf_explorer');

-- Ensure trx_id column exists
SET @has_trx_id = (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db_name
        AND table_name = 'transactions'
        AND column_name = 'trx_id'
    )
    THEN 1
    ELSE 0
  END
);

SET @sql_add_trx_id = IF(
  @has_trx_id = 1,
  'SELECT ''trx_id already exists'' AS info',
  CONCAT(
    'ALTER TABLE `', @db_name, '`.`transactions` ',
    'ADD COLUMN `trx_id` VARCHAR(255) NULL AFTER `payment_id`'
  )
);

PREPARE stmt_add_trx_id FROM @sql_add_trx_id;
EXECUTE stmt_add_trx_id;
DEALLOCATE PREPARE stmt_add_trx_id;

-- Backfill trx_id from legacy stripe_session_id where available
SET @has_legacy_stripe_col = (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db_name
        AND table_name = 'transactions'
        AND column_name = 'stripe_session_id'
    )
    THEN 1
    ELSE 0
  END
);

SET @sql_backfill_trx_id = IF(
  @has_legacy_stripe_col = 1,
  CONCAT(
    'UPDATE `', @db_name, '`.`transactions` ',
    'SET `trx_id` = `stripe_session_id` ',
    'WHERE `trx_id` IS NULL AND `stripe_session_id` IS NOT NULL'
  ),
  'SELECT ''No legacy stripe_session_id column found'' AS info'
);

PREPARE stmt_backfill_trx_id FROM @sql_backfill_trx_id;
EXECUTE stmt_backfill_trx_id;
DEALLOCATE PREPARE stmt_backfill_trx_id;

-- Ensure unique index on trx_id exists
SET @has_trx_idx = (
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.statistics
      WHERE table_schema = @db_name
        AND table_name = 'transactions'
        AND index_name = 'ux_transactions_trx_id'
    )
    THEN 1
    ELSE 0
  END
);

SET @sql_add_trx_idx = IF(
  @has_trx_idx = 1,
  'SELECT ''trx_id unique index already exists'' AS info',
  CONCAT(
    'CREATE UNIQUE INDEX `ux_transactions_trx_id` ',
    'ON `', @db_name, '`.`transactions`(`trx_id`)'
  )
);

PREPARE stmt_add_trx_idx FROM @sql_add_trx_idx;
EXECUTE stmt_add_trx_idx;
DEALLOCATE PREPARE stmt_add_trx_idx;

-- Drop legacy stripe_session_id column if it exists
SET @sql_drop_legacy_stripe_col = IF(
  @has_legacy_stripe_col = 1,
  CONCAT(
    'ALTER TABLE `', @db_name, '`.`transactions` ',
    'DROP COLUMN `stripe_session_id`'
  ),
  'SELECT ''No legacy stripe_session_id to drop'' AS info'
);

PREPARE stmt_drop_legacy_stripe_col FROM @sql_drop_legacy_stripe_col;
EXECUTE stmt_drop_legacy_stripe_col;
DEALLOCATE PREPARE stmt_drop_legacy_stripe_col;
