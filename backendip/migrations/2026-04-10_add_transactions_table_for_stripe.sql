-- Turf Explorer migration: add transactions table for Stripe Checkout
-- Safe for existing databases: checks if table already exists before creating.

SET @db_name = COALESCE(DATABASE(), 'turf_explorer');

SET @sql_create_transactions = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = @db_name
        AND table_name = 'transactions'
    ),
    'SELECT ''transactions table already exists'' AS info',
    CONCAT(
      'CREATE TABLE `', @db_name, '`.`transactions` (',
      'id BIGINT PRIMARY KEY AUTO_INCREMENT,',
      'booking_id BIGINT NOT NULL,',
      'amount DECIMAL(10, 2) NOT NULL,',
      'status ENUM(''PENDING'', ''SUCCESS'', ''FAILED'') NOT NULL DEFAULT ''PENDING'',',
      'stripe_session_id VARCHAR(255) NOT NULL UNIQUE,',
      'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
      'FOREIGN KEY (booking_id) REFERENCES `', @db_name, '`.`bookings`(id) ON DELETE CASCADE,',
      'INDEX idx_transactions_booking (booking_id),',
      'INDEX idx_transactions_status (status)',
      ')' 
    )
  )
);

PREPARE stmt FROM @sql_create_transactions;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
