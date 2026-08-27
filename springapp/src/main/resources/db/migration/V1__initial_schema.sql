-- ============================================================
-- DriveEase — V1 Initial Schema
-- ============================================================
-- This migration creates all tables based on the existing
-- JPA entities. Uses MySQL 8 syntax.
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS user (
    user_id       BIGINT          NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255)    NOT NULL,
    password      VARCHAR(255)    NOT NULL,
    username      VARCHAR(50)     NOT NULL,
    mobile_number VARCHAR(10),
    user_role     VARCHAR(50)     NOT NULL DEFAULT 'customer',
    is_deleted    TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id),
    CONSTRAINT uk_user_email UNIQUE (email)
);

-- Drivers table
CREATE TABLE IF NOT EXISTS driver (
    driver_id           BIGINT          NOT NULL AUTO_INCREMENT,
    driver_name         VARCHAR(80)     NOT NULL,
    license_number      VARCHAR(50)     NOT NULL,
    experience_years    INT             NOT NULL DEFAULT 0,
    contact_number      VARCHAR(10),
    availability_status VARCHAR(20)     NOT NULL DEFAULT 'Active',
    address             VARCHAR(200),
    vehicle_type        VARCHAR(20),
    hourly_rate         DOUBLE          NOT NULL,
    is_deleted          TINYINT(1)      NOT NULL DEFAULT 0,
    image               LONGBLOB,
    PRIMARY KEY (driver_id)
);

-- Driver Requests (bookings) table
CREATE TABLE IF NOT EXISTS driver_request (
    driver_request_id   BIGINT          NOT NULL AUTO_INCREMENT,
    request_date        DATE,
    status              VARCHAR(50),
    trip_date           DATE,
    time_slot           TIME,
    pickup_location     VARCHAR(255),
    drop_location       VARCHAR(255),
    estimated_duration  VARCHAR(100),
    payment_amount      DOUBLE,
    comments            VARCHAR(500),
    actual_drop_time    TIME,
    actual_drop_date    DATE,
    actual_duration     VARCHAR(100),
    payment_id          VARCHAR(100),
    is_deleted          TINYINT(1)      NOT NULL DEFAULT 0,
    user_id             BIGINT          NOT NULL,
    driver_id           BIGINT,
    PRIMARY KEY (driver_request_id),
    CONSTRAINT fk_request_user   FOREIGN KEY (user_id)   REFERENCES user (user_id),
    CONSTRAINT fk_request_driver FOREIGN KEY (driver_id) REFERENCES driver (driver_id)
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id     BIGINT          NOT NULL AUTO_INCREMENT,
    category        VARCHAR(100)    NOT NULL,
    rating          INT             NOT NULL,
    feedback_text   VARCHAR(1000)   NOT NULL,
    date            DATE,
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    user_id         BIGINT,
    driver_id       BIGINT,
    PRIMARY KEY (feedback_id),
    CONSTRAINT fk_feedback_user   FOREIGN KEY (user_id)   REFERENCES user (user_id),
    CONSTRAINT fk_feedback_driver FOREIGN KEY (driver_id) REFERENCES driver (driver_id)
);

-- ===== Indexes for frequently queried fields =====
CREATE INDEX IF NOT EXISTS idx_user_email        ON user (email);
CREATE INDEX IF NOT EXISTS idx_request_user_id   ON driver_request (user_id);
CREATE INDEX IF NOT EXISTS idx_request_driver_id ON driver_request (driver_id);
CREATE INDEX IF NOT EXISTS idx_request_status    ON driver_request (status);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id  ON feedback (user_id);

-- ===== Insert default admin user =====
-- Password must be updated immediately in production!
-- Placeholder: password is 'ChangeMe123!' — BCrypt encoded
INSERT IGNORE INTO user (email, password, username, user_role, is_deleted)
VALUES (
    'admin@driveease.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCakPzTenW0lAnL0TjTlIpe',
    'Admin',
    'admin',
    0
);
