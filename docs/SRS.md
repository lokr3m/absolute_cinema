# Software Requirements Specification (Current Scope)

Project: Absolute Cinema

## 1. Introduction

### 1.1 Purpose
This document describes the current functional scope of the Absolute Cinema web application.

### 1.2 Scope
Absolute Cinema provides:
- Public browsing of films and showtimes
- Seat selection and booking confirmation
- A schedule view and news feed powered by Apollo Kino data
- An admin dashboard for sessions and bookings (no authentication)

Out of scope:
- Real payment processing
- User authentication and booking history
- Seat hold/lock timers
- Email confirmations

## 2. Functional Requirements

### FR-1: Browse Films
Users can view a list of films and open a film detail page showing metadata and sessions.

### FR-2: View Schedule
Users can browse sessions by date via the schedule page.

### FR-3: Seat Layout
Users can view a hall layout for a session, including occupied seats.

### FR-4: Create Booking
Users can create a booking by selecting seats and providing contact details. The system returns a booking number.

### FR-5: Retrieve Booking
Users can retrieve booking details using a booking number.

### FR-6: Admin Management
Admins can list and manage sessions, view bookings, and sync cinemas from Apollo Kino.

## 3. Non-Functional Requirements

- NFR-1: The application runs locally with Node.js, MongoDB, and Vue 3.
- NFR-2: Payment details are not stored or processed.
- NFR-3: API responses include a consistent `success` flag and error message.

## 4. Dependencies

- MongoDB for data persistence
- Apollo Kino XML API for optional data synchronization
