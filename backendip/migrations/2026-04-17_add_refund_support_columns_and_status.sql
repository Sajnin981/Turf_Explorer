-- Turf Explorer migration: ensure transactions table supports refund flow
-- 1) Adds legacy trx storage column stripe_session_id if missing
-- 2) Ensures status enum includes REFUNDED

SET @db_name = COALESCE(DATABASE(), 'turf_explorer');

-- Add stripe_session_id column only if missing
SET @has_stripe_session_id = (
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

SET @sql_add_stripe_session_id = IF(
  @has_stripe_session_id = 1,
  'SELECT ''stripe_session_id already exists'' AS info',
  CONCAT(
    'ALTER TABLE `', @db_name, '`.`transactions` ',
    'ADD COLUMN `stripe_session_id` VARCHAR(255) NULL AFTER `payment_id`'
  )
);

PREPARE stmt_add_col FROM @sql_add_stripe_session_id;
EXECUTE stmt_add_col;
DEALLOCATE PREPARE stmt_add_col;

-- Ensure status enum supports REFUNDED
SET @status_column_type = (
  SELECT column_type
  FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'transactions'
    AND column_name = 'status'
  LIMIT 1
);

SET @has_refunded = (
  SELECT CASE
    WHEN @status_column_type IS NOT NULL
     AND LOWER(@status_column_type) LIKE '%refunded%'
    THEN 1
    ELSE 0
  END
);

SET @sql_update_status_enum = IF(
  @has_refunded = 1,
  'SELECT ''status already supports REFUNDED'' AS info',
  CONCAT(
    'ALTER TABLE `', @db_name, '`.`transactions` ',
    'MODIFY COLUMN `status` ENUM(''PENDING'', ''SUCCESS'', ''FAILED'', ''REFUNDED'') ',
    'NOT NULL DEFAULT ''PENDING''' 
  )
);

PREPARE stmt_update_enum FROM @sql_update_status_enum;
EXECUTE stmt_update_enum;
DEALLOCATE PREPARE stmt_update_enum;
