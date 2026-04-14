ALTER TABLE users
    ADD COLUMN reset_otp VARCHAR(255) NULL,
    ADD COLUMN reset_otp_expiry DATETIME NULL;
