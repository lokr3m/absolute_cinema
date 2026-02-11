# Absolute Cinema Booking API

This document describes the booking-related API endpoints used by the Absolute Cinema frontend.

## Overview

The booking flow relies on:
- Browsing films and sessions
- Fetching seat layout and occupied seats for a session
- Creating a booking using seat row/number selections
- Retrieving a booking by its booking number

## API Endpoints

### 1. Get Seat Layout for a Session

**Endpoint:** `GET /api/sessions/:id/seats`

**Description:** Returns the hall layout and currently occupied seats for a session.

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session_id",
      "film": "Film Title",
      "startTime": "2026-02-12T16:30:00.000Z",
      "hall": "Hall 1",
      "cinema": "Apollo Kino Solaris"
    },
    "layout": {
      "rows": 10,
      "seatsPerRow": 12,
      "capacity": 120,
      "available": 110
    },
    "occupied": [
      { "row": 3, "number": 5 },
      { "row": 3, "number": 6 }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Successfully returned seat layout
- `400 Bad Request`: Invalid session ID
- `404 Not Found`: Session not found
- `500 Internal Server Error`: Server error

---

### 2. Create a Booking

**Endpoint:** `POST /api/bookings`

**Description:** Creates a new booking from selected seats. Seats are provided as row/number pairs.

**Request Body:**
```json
{
  "sessionId": "session_id",
  "seats": [
    { "row": 4, "number": 7 },
    { "row": 4, "number": 8 }
  ],
  "contactEmail": "user@example.com",
  "contactPhone": "+372 5555 5555",
  "paymentMethod": "card",
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking_id",
    "bookingNumber": "BK-3f1b9c2e1a2b",
    "totalPrice": 17,
    "seats": [
      { "row": 4, "number": 7 },
      { "row": 4, "number": 8 }
    ],
    "session": "session_id",
    "status": "pending"
  }
}
```

**Validation Rules:**
- `sessionId` is required and must be a valid ObjectId
- `seats` must be a non-empty array of `{ row, number }` pairs
- Seats must fit within the hall layout
- Duplicate seats in the request are rejected
- `contactEmail` is required

**Status Codes:**
- `201 Created`: Booking created successfully
- `400 Bad Request`: Missing/invalid fields or invalid seat selection
- `404 Not Found`: Session not found
- `409 Conflict`: One or more seats are already booked
- `500 Internal Server Error`: Server error

---

### 3. Get Booking by Booking Number

**Endpoint:** `GET /api/bookings/:bookingNumber`

**Description:** Retrieves a booking by its booking number (e.g., `BK-3f1b9c2e1a2b`).

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingNumber": "BK-3f1b9c2e1a2b",
    "contactEmail": "user@example.com",
    "status": "pending",
    "session": {
      "startTime": "2026-02-12T16:30:00.000Z"
    },
    "seats": [
      { "row": 4, "number": 7 },
      { "row": 4, "number": 8 }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved booking
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Server error

---

## Supporting Endpoints

These endpoints are used to power the booking flow:
- `GET /api/films`
- `GET /api/films/:id/sessions`
- `GET /api/sessions` (supports `filmId`, `cinemaId`, `hallId`, `date`)
- `GET /api/cinemas`
- `GET /api/cinemas/:id/halls`

## Error Handling

Errors follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Notes

- Payment card fields are collected in the UI for demo purposes and are not stored.
- Booking status defaults to `pending`; updates are currently handled through the admin UI.
