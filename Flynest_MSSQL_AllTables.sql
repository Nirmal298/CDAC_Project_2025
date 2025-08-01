
-- ============================================
-- FLYNEST DATABASE SCHEMA (MSSQL VERSION WITH ALL TABLES AND SAMPLE DATA)
-- ============================================

-- Drop tables if exist (for clean execution)
IF OBJECT_ID('payment', 'U') IS NOT NULL DROP TABLE payment;
IF OBJECT_ID('ticket', 'U') IS NOT NULL DROP TABLE ticket;
IF OBJECT_ID('passengers', 'U') IS NOT NULL DROP TABLE passengers;
IF OBJECT_ID('booking', 'U') IS NOT NULL DROP TABLE booking;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
IF OBJECT_ID('flights', 'U') IS NOT NULL DROP TABLE flights;
IF OBJECT_ID('airplanes', 'U') IS NOT NULL DROP TABLE airplanes;
IF OBJECT_ID('airports', 'U') IS NOT NULL DROP TABLE airports;
IF OBJECT_ID('airlines', 'U') IS NOT NULL DROP TABLE airlines;
IF OBJECT_ID('cities', 'U') IS NOT NULL DROP TABLE cities;
IF OBJECT_ID('countries', 'U') IS NOT NULL DROP TABLE countries;

-- Table: countries
CREATE TABLE countries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    iso2 VARCHAR(10) NOT NULL UNIQUE,
    iso3 VARCHAR(10),
    numeric_code INT,
    phone_code VARCHAR(10),
    capital VARCHAR(100),
    currency VARCHAR(20),
    currency_name VARCHAR(50),
    currency_symbol VARCHAR(10),
    tld VARCHAR(10),
    native VARCHAR(50),
    region VARCHAR(50),
    subregion VARCHAR(50),
    timezones NVARCHAR(MAX),
    translations NVARCHAR(MAX)
);

INSERT INTO countries (name, iso2, iso3, numeric_code, phone_code, capital, currency, currency_name, currency_symbol, tld, native, region, subregion, timezones, translations) VALUES
('India', 'IN', 'IND', 356, '+91', 'New Delhi', 'INR', 'Indian Rupee', '₹', '.in', 'भारत', 'Asia', 'Southern Asia', 'Asia/Kolkata', '{"hi":"भारत"}'),
('United States', 'US', 'USA', 840, '+1', 'Washington', 'USD', 'US Dollar', '$', '.us', 'United States', 'Americas', 'Northern America', 'America/New_York', '{"en":"United States"}'),
('United Kingdom', 'GB', 'GBR', 826, '+44', 'London', 'GBP', 'Pound Sterling', '£', '.uk', 'United Kingdom', 'Europe', 'Northern Europe', 'Europe/London', '{"en":"United Kingdom"}'),
('United Arab Emirates', 'AE', 'ARE', 784, '+971', 'Abu Dhabi', 'AED', 'Dirham', 'د.إ', '.ae', 'الإمارات', 'Asia', 'Western Asia', 'Asia/Dubai', '{"ar":"الإمارات"}'),
('Singapore', 'SG', 'SGP', 702, '+65', 'Singapore', 'SGD', 'Singapore Dollar', 'S$', '.sg', 'Singapore', 'Asia', 'South-Eastern Asia', 'Asia/Singapore', '{"en":"Singapore"}');

-- Table: cities
CREATE TABLE cities (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country_iso2 VARCHAR(10),
    latitude FLOAT,
    longitude FLOAT,
    timezone VARCHAR(100),
    population INT,
    FOREIGN KEY (country_iso2) REFERENCES countries(iso2)
);

INSERT INTO cities (name, state, country_iso2, latitude, longitude, timezone, population) VALUES
('New Delhi', 'Delhi', 'IN', 28.6139, 77.2090, 'Asia/Kolkata', 19000000),
('Mumbai', 'Maharashtra', 'IN', 19.0760, 72.8777, 'Asia/Kolkata', 20000000),
('New York', 'New York', 'US', 40.7128, -74.0060, 'America/New_York', 8500000),
('London', 'England', 'GB', 51.5074, -0.1278, 'Europe/London', 8900000),
('Dubai', 'Dubai', 'AE', 25.276987, 55.296249, 'Asia/Dubai', 3300000);

-- Table: airlines
CREATE TABLE airlines (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100),
    iata_code VARCHAR(10) UNIQUE,
    icao_code VARCHAR(10),
    callsign VARCHAR(50),
    country_iso2 VARCHAR(10),
    type VARCHAR(50),
    status VARCHAR(50),
    fleet_size INT,
    FOREIGN KEY (country_iso2) REFERENCES countries(iso2)
);

INSERT INTO airlines (name, iata_code, icao_code, callsign, country_iso2, type, status, fleet_size) VALUES
('Air India', 'AI', 'AIC', 'AIRINDIA', 'IN', 'Scheduled', 'Active', 120),
('IndiGo', '6E', 'IGO', 'IFLY', 'IN', 'Scheduled', 'Active', 250),
('Delta Airlines', 'DL', 'DAL', 'DELTA', 'US', 'Scheduled', 'Active', 900),
('Emirates', 'EK', 'UAE', 'EMIRATES', 'AE', 'Scheduled', 'Active', 300),
('British Airways', 'BA', 'BAW', 'SPEEDBIRD', 'GB', 'Scheduled', 'Active', 280);

-- Table: airports
CREATE TABLE airports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100),
    iata_code VARCHAR(10) UNIQUE,
    icao_code VARCHAR(10),
    city_id INT,
    city VARCHAR(100),
    state VARCHAR(100),
    country_iso2 VARCHAR(10),
    latitude FLOAT,
    longitude FLOAT,
    elevation INT,
    timezone VARCHAR(100),
    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (country_iso2) REFERENCES countries(iso2)
);

INSERT INTO airports (name, iata_code, icao_code, city_id, city, state, country_iso2, latitude, longitude, elevation, timezone) VALUES
('Indira Gandhi International Airport', 'DEL', 'VIDP', 1, 'New Delhi', 'Delhi', 'IN', 28.5562, 77.1000, 777, 'Asia/Kolkata'),
('Chhatrapati Shivaji Maharaj International Airport', 'BOM', 'VABB', 2, 'Mumbai', 'Maharashtra', 'IN', 19.0896, 72.8656, 39, 'Asia/Kolkata'),
('John F. Kennedy International Airport', 'JFK', 'KJFK', 3, 'New York', 'New York', 'US', 40.6413, -73.7781, 13, 'America/New_York'),
('London Heathrow Airport', 'LHR', 'EGLL', 4, 'London', 'England', 'GB', 51.4700, -0.4543, 83, 'Europe/London'),
('Dubai International Airport', 'DXB', 'OMDB', 5, 'Dubai', 'Dubai', 'AE', 25.2532, 55.3657, 62, 'Asia/Dubai');

-- Table: airplanes
CREATE TABLE airplanes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100),
    model VARCHAR(100),
    registration_number VARCHAR(50),
    airline_iata VARCHAR(10),
    capacity INT,
    FOREIGN KEY (airline_iata) REFERENCES airlines(iata_code)
);

INSERT INTO airplanes (name, model, registration_number, airline_iata, capacity) VALUES
('Airbus A320', 'A320', 'VT-ABC', 'AI', 180),
('Boeing 737', '737-800', 'VT-XYZ', '6E', 189),
('Boeing 777', '777-300ER', 'N777DL', 'DL', 396),
('Airbus A380', 'A380-800', 'A6-EUE', 'EK', 500),
('Boeing 787', '787-9', 'G-ZBLA', 'BA', 242);

-- Table: flights
CREATE TABLE flights (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    flight_date DATE,
    flight_status VARCHAR(50),
    departure_airport VARCHAR(100),
    departure_timezone VARCHAR(100),
    departure_iata VARCHAR(10),
    departure_icao VARCHAR(10),
    departure_terminal VARCHAR(50),
    departure_gate VARCHAR(50),
    departure_delay INT,
    arrival_airport VARCHAR(100),
    arrival_timezone VARCHAR(100),
    arrival_iata VARCHAR(10),
    arrival_icao VARCHAR(10),
    arrival_terminal VARCHAR(50),
    arrival_gate VARCHAR(50),
    arrival_baggage VARCHAR(50),
    arrival_delay INT,
    airline_name VARCHAR(100),
    airline_iata VARCHAR(10),
    airline_icao VARCHAR(10),
    flight_number VARCHAR(50),
    aircraft_id INT,
    FOREIGN KEY (aircraft_id) REFERENCES airplanes(id)
);

INSERT INTO flights (flight_date, flight_status, departure_airport, departure_timezone, departure_iata, departure_icao, departure_terminal, departure_gate, departure_delay, arrival_airport, arrival_timezone, arrival_iata, arrival_icao, arrival_terminal, arrival_gate, arrival_baggage, arrival_delay, airline_name, airline_iata, airline_icao, flight_number, aircraft_id) VALUES
('2025-08-01', 'Scheduled', 'Indira Gandhi International Airport', 'Asia/Kolkata', 'DEL', 'VIDP', 'T3', 'G12', 10, 'John F. Kennedy International Airport', 'America/New_York', 'JFK', 'KJFK', '4', 'B7', 'Belt 3', 5, 'Air India', 'AI', 'AIC', 'AI101', 1),
('2025-08-02', 'Scheduled', 'Chhatrapati Shivaji Maharaj International Airport', 'Asia/Kolkata', 'BOM', 'VABB', 'T2', 'F6', 5, 'Dubai International Airport', 'Asia/Dubai', 'DXB', 'OMDB', '1', 'C3', 'Belt 5', 3, 'IndiGo', '6E', 'IGO', '6E121', 2),
('2025-08-03', 'Scheduled', 'John F. Kennedy International Airport', 'America/New_York', 'JFK', 'KJFK', 'T1', 'D8', 0, 'London Heathrow Airport', 'Europe/London', 'LHR', 'EGLL', '5', 'A2', 'Belt 6', 2, 'Delta Airlines', 'DL', 'DAL', 'DL404', 3),
('2025-08-04', 'Scheduled', 'Dubai International Airport', 'Asia/Dubai', 'DXB', 'OMDB', 'T3', 'E10', 0, 'London Heathrow Airport', 'Europe/London', 'LHR', 'EGLL', '5', 'B1', 'Belt 8', 0, 'Emirates', 'EK', 'UAE', 'EK502', 4),
('2025-08-05', 'Scheduled', 'London Heathrow Airport', 'Europe/London', 'LHR', 'EGLL', 'T4', 'H4', 15, 'Indira Gandhi International Airport', 'Asia/Kolkata', 'DEL', 'VIDP', '3', 'C4', 'Belt 9', 10, 'British Airways', 'BA', 'BAW', 'BA257', 5);

-- Continue with users, booking, passengers, ticket, payment (with sample data)
-- Table: users
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20) UNIQUE,
    created_at DATETIME DEFAULT GETDATE()
);

INSERT INTO users (name, email, password, phone) VALUES
('John Doe', 'john@example.com', 'hashedpass1', '9876543210'),
('Jane Smith', 'jane@example.com', 'hashedpass2', '8765432109'),
('Rahul Sharma', 'rahul@example.com', 'hashedpass3', '9988776655'),
('Priya Kapoor', 'priya@example.com', 'hashedpass4', '8877665544'),
('David Miller', 'david@example.com', 'hashedpass5', '7766554433');

-- Table: booking
CREATE TABLE booking (
    booking_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    flight_id BIGINT,
    booking_date DATETIME DEFAULT GETDATE(),
    status VARCHAR(20) CHECK (status IN ('Confirmed','Pending','Cancelled')),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);

INSERT INTO booking (user_id, flight_id, status) VALUES
(1, 1, 'Confirmed'),
(2, 2, 'Pending'),
(3, 3, 'Confirmed'),
(4, 4, 'Pending'),
(5, 5, 'Confirmed');

-- Table: passengers
CREATE TABLE passengers (
    passenger_id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT,
    full_name VARCHAR(100),
    gender VARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
    age INT,
    passport_number VARCHAR(50) UNIQUE,
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE
);

INSERT INTO passengers (booking_id, full_name, gender, age, passport_number) VALUES
(1, 'John Doe', 'Male', 32, 'P12345678'),
(2, 'Jane Smith', 'Female', 28, 'P23456789'),
(3, 'Rahul Sharma', 'Male', 35, 'P34567890'),
(4, 'Priya Kapoor', 'Female', 30, 'P45678901'),
(5, 'David Miller', 'Male', 40, 'P56789012');

-- Table: ticket
CREATE TABLE ticket (
    ticket_id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT,
    ticket_number VARCHAR(50) UNIQUE,
    seat_number VARCHAR(10),
    class VARCHAR(20) CHECK (class IN ('Economy','Business','First')),
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE
);

INSERT INTO ticket (booking_id, ticket_number, seat_number, class) VALUES
(1, 'TCKT1001', '12A', 'Economy'),
(2, 'TCKT1002', '14B', 'Business'),
(3, 'TCKT1003', '15C', 'Economy'),
(4, 'TCKT1004', '16D', 'First'),
(5, 'TCKT1005', '17E', 'Economy');

-- Table: payment
CREATE TABLE payment (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT,
    stripe_payment_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10,2),
    currency VARCHAR(10),
    payment_status VARCHAR(20) CHECK (payment_status IN ('succeeded','pending','failed')),
    payment_method_type VARCHAR(50),
    receipt_url VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id) ON DELETE CASCADE
);

INSERT INTO payment (booking_id, stripe_payment_id, amount, currency, payment_status, payment_method_type, receipt_url) VALUES
(1, 'pi_1234567890', 500.00, 'INR', 'succeeded', 'card', 'https://stripe.com/receipt1'),
(2, 'pi_9876543210', 300.00, 'INR', 'pending', 'card', 'https://stripe.com/receipt2'),
(3, 'pi_1122334455', 700.00, 'USD', 'succeeded', 'card', 'https://stripe.com/receipt3'),
(4, 'pi_2233445566', 450.00, 'AED', 'pending', 'card', 'https://stripe.com/receipt4'),
(5, 'pi_3344556677', 650.00, 'GBP', 'succeeded', 'card', 'https://stripe.com/receipt5');
