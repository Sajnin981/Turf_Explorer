-- Turf Explorer Database Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS turf_explorer;
USE turf_explorer;

-- Users Table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    role ENUM('USER', 'OWNER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Turfs Table
CREATE TABLE turfs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    turf_type VARCHAR(50) NOT NULL,
    price_per_hour DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    owner_id BIGINT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_owner (owner_id)
);

-- Slots Table
CREATE TABLE slots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    turf_id BIGINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('AVAILABLE', 'BOOKED') NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turf_id) REFERENCES turfs(id) ON DELETE CASCADE,
    INDEX idx_turf (turf_id),
    INDEX idx_status (status)
);

-- Bookings Table
CREATE TABLE bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    turf_id BIGINT NOT NULL,
    slot_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    payment_status ENUM('PENDING', 'SUCCESS', 'PARTIAL', 'FULL', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    due_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (turf_id) REFERENCES turfs(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_turf (turf_id),
    INDEX idx_slot (slot_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_booking_date (booking_date)
);

-- Payments Table
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    turf_id BIGINT NOT NULL,
    slot_id BIGINT NOT NULL,
    booking_date DATE NOT NULL,
    booking_id BIGINT,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    gateway_transaction_id VARCHAR(100),
    validation_id VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2),
    is_partial BOOLEAN DEFAULT FALSE,
    status ENUM('PENDING', 'SUCCESS', 'PARTIAL', 'FULL', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    raw_init_response LONGTEXT,
    raw_validation_response LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (turf_id) REFERENCES turfs(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_payment_booking (booking_id),
    INDEX idx_payment_turf (turf_id),
    INDEX idx_payment_slot (slot_id),
    INDEX idx_payment_date (booking_date),
    INDEX idx_payment_tran (transaction_id),
    INDEX idx_payment_status (status)
);

-- Insert Sample Admin User (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@turfexplorer.com', '$2a$10$oxUwEm6ESlh11L0BYgunTeRaUO6jTF9exb8nVaj.cJLQx5xLHWj3e', 'ADMIN');

-- Insert Sample Regular User (password: user123)
INSERT INTO users (name, email, password, role) VALUES 
('John Doe', 'john@example.com', '$2a$10$xBDUuA0IfbTv3pZ40Rwk0exIHFIBSHd2LQLSByLpUj2u1EjNvlpAW', 'USER');

-- Insert Sample Turfs
INSERT INTO turfs (name, location, latitude, longitude, turf_type, price_per_hour, description, image_url, owner_id, status) VALUES
('Chittagong Sports Arena', 'Agrabad, Chittagong', 22.3235, 91.8123, 'Football', 1500.00, 'Premium football turf with floodlights', 'https://example.com/turf1.jpg', 2, 'APPROVED'),
('Cricket Ground Premium', 'GEC Circle, Chittagong', 22.3569, 91.8206, 'Cricket', 2000.00, 'Professional cricket ground with pavilion', 'https://example.com/turf2.jpg', 2, 'APPROVED'),
('Multi-Sport Complex', 'Oxygen, Chittagong', 22.3860, 91.8381, 'Other', 1200.00, 'Multi-purpose sports facility', 'https://example.com/turf3.jpg', 2, 'APPROVED');

-- Insert Sample Slots
INSERT INTO slots (turf_id, start_time, end_time, price, status) VALUES
(1, '06:00:00', '08:00:00', 1200.00, 'AVAILABLE'),
(1, '08:00:00', '10:00:00', 1500.00, 'AVAILABLE'),
(1, '16:00:00', '18:00:00', 1800.00, 'AVAILABLE'),
(2, '07:00:00', '10:00:00', 2000.00, 'AVAILABLE'),
(2, '14:00:00', '17:00:00', 2200.00, 'AVAILABLE'),
(3, '09:00:00', '11:00:00', 1000.00, 'AVAILABLE');

-- Existing DB migration hints for partial-payment support
-- ALTER TABLE bookings
--   MODIFY payment_status ENUM('PENDING','SUCCESS','PARTIAL','FULL','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
--   ADD COLUMN total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
--   ADD COLUMN paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
--   ADD COLUMN due_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
--
-- ALTER TABLE payments
--   MODIFY status ENUM('PENDING','SUCCESS','PARTIAL','FULL','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
--   ADD COLUMN total_amount DECIMAL(10,2) NULL,
--   ADD COLUMN paid_amount DECIMAL(10,2) NULL,
--   ADD COLUMN is_partial BOOLEAN DEFAULT FALSE;
