# Booking API Documentation

This document describes the booking API endpoints that allow users to book movie tickets.

## Overview

The booking system allows users to:
- View available films and sessions
- Select seats for a specific session
- Create and manage bookings
- Track payment status

## API Endpoints

### 1. Get Available Seats for a Session

**Endpoint:** `GET /api/sessions/:id/seats`

**Description:** Retrieves all seats for a specific session, including their availability status.

**Parameters:**
- `id` (path parameter): The session ID

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session_id",
    "availableSeats": 100
  },
  "hall": {
    "name": "Hall 1",
    "rows": 10,
    "seatsPerRow": 12
  },
  "count": 120,
  "data": [
    {
      "_id": "seat_id",
      "row": 1,
      "number": 1,
      "seatType": "standard",
      "isAvailable": true
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved seats
- `400 Bad Request`: Invalid session ID
- `404 Not Found`: Session not found
- `500 Internal Server Error`: Server error

---

### 2. Create a Booking

**Endpoint:** `POST /api/bookings`

**Description:** Creates a new booking for selected seats in a session.

**Request Body:**
```json
{
  "sessionId": "session_id",
  "seatIds": ["seat_id_1", "seat_id_2"],
  "contactEmail": "user@example.com",
  "contactPhone": "+372 5555 5555",
  "userId": "user_id" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "booking_id",
    "user": {
      "_id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com"
    },
    "session": {
      "_id": "session_id",
      "startTime": "2024-01-20T19:00:00.000Z",
      "film": { ... },
      "hall": { ... }
    },
    "seats": [ ... ],
    "totalPrice": 17.00,
    "bookingNumber": "BK-1234567890-ABC123",
    "status": "pending",
    "paymentStatus": "pending",
    "contactEmail": "user@example.com",
    "contactPhone": "+372 5555 5555",
    "createdAt": "2024-01-20T15:30:00.000Z"
  }
}
```

**Validation Rules:**
- `sessionId` is required and must be a valid ObjectId
- `seatIds` must be an array with at least one seat ID
- `contactEmail` is required and must be a valid email
- Selected seats must exist and be available
- Session must be in the future

**Status Codes:**
- `201 Created`: Booking created successfully
- `400 Bad Request`: Missing or invalid fields
- `404 Not Found`: Session or seats not found
- `409 Conflict`: One or more seats are already booked
- `500 Internal Server Error`: Server error

---

### 3. Get Booking by ID

**Endpoint:** `GET /api/bookings/:id`

**Description:** Retrieves detailed information about a specific booking.

**Parameters:**
- `id` (path parameter): The booking ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "booking_id",
    "user": { ... },
    "session": {
      "film": { ... },
      "hall": {
        "cinema": { ... }
      }
    },
    "seats": [ ... ],
    "totalPrice": 17.00,
    "bookingNumber": "BK-1234567890-ABC123",
    "status": "confirmed",
    "paymentStatus": "paid",
    "paymentMethod": "card",
    "contactEmail": "user@example.com",
    "contactPhone": "+372 5555 5555",
    "createdAt": "2024-01-20T15:30:00.000Z",
    "updatedAt": "2024-01-20T15:35:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved booking
- `400 Bad Request`: Invalid booking ID
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Server error

---

### 4. Update Booking

**Endpoint:** `PUT /api/bookings/:id`

**Description:** Updates booking status and payment information.

**Parameters:**
- `id` (path parameter): The booking ID

**Request Body:**
```json
{
  "status": "confirmed",
  "paymentStatus": "paid",
  "paymentMethod": "card"
}
```

**Valid Values:**
- `status`: "pending", "confirmed", "cancelled", "completed"
- `paymentStatus`: "pending", "paid", "refunded"
- `paymentMethod`: "card", "cash", "online"

**Response:**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": { ... }
}
```

**Special Behavior:**
- When status is changed to "cancelled", the seats are automatically released and become available again

**Status Codes:**
- `200 OK`: Booking updated successfully
- `400 Bad Request`: Invalid booking ID or invalid field values
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Server error

---

## Frontend Integration

### Booking Page

The booking page (`/booking`) accepts the following query parameters:

- `filmId`: Pre-selects a specific film
- `sessionId`: Pre-selects a specific session and jumps to seat selection

**Example URLs:**
- `/booking?filmId=123456` - Opens booking page with film pre-selected
- `/booking?filmId=123456&sessionId=789012` - Opens booking page with film and session pre-selected, shows seat selection

### Movie Detail Page

The movie detail page shows available showtimes for a film. Each showtime button redirects to the booking page with the film and session pre-selected.

**Implementation:**
```javascript
bookSession(session) {
  this.$router.push({
    name: 'Booking',
    query: {
      filmId: this.film._id,
      sessionId: session._id
    }
  })
}
```

---

## Database Schema

### Booking Model

```javascript
{
  user: ObjectId (ref: 'User'),
  session: ObjectId (ref: 'Session'),
  seats: [ObjectId] (ref: 'Seat'),
  totalPrice: Number,
  bookingNumber: String (unique),
  status: String (enum: ['pending', 'confirmed', 'cancelled', 'completed']),
  paymentStatus: String (enum: ['pending', 'paid', 'refunded']),
  paymentMethod: String (enum: ['card', 'cash', 'online']),
  contactEmail: String,
  contactPhone: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing

### Manual Testing

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. Seed the database with test data:
   ```bash
   npm run seed
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

4. Navigate to a movie detail page and click on a showtime
5. Select seats and complete the booking flow

### API Testing

Use the provided test script:
```bash
./test_booking_api.sh
```

This will test all booking API endpoints automatically.

---

## Error Handling

All endpoints return errors in the following format:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message (optional)"
}
```

Common error scenarios:
- Invalid ObjectId format → 400 Bad Request
- Resource not found → 404 Not Found
- Seats already booked → 409 Conflict
- Database or server errors → 500 Internal Server Error

---

## Security Considerations

1. **Input Validation**: All inputs are validated before processing
2. **Race Conditions**: Booking creation checks for seat availability atomically
3. **Guest Users**: When no userId is provided, a guest user is created automatically
4. **Email Validation**: Contact email is required for all bookings
5. **Session Validation**: Can only book seats for future sessions

---

## Future Improvements

Potential enhancements:
1. Add authentication and authorization
2. Implement booking expiration (e.g., 15-minute hold time)
3. Add payment gateway integration
4. Send confirmation emails
5. Add booking history for users
6. Implement refund logic
7. Add booking search by booking number
8. Add admin endpoints for managing bookings
