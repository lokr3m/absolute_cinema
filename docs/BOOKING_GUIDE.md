# Absolute Cinema Booking Guide

This guide explains how to use the booking flow in the Absolute Cinema application.

## Overview

The booking flow lets users:
- Browse films and showtimes
- Select seats for a session
- Provide contact details
- Receive a booking number confirmation

## User Flow

### 1. Browse Movies or Schedule
- Visit **Movies** to see all films and open a movie detail page.
- Visit **Schedule** to view sessions by date.

### 2. Start a Booking
From a movie detail page or schedule listing, choose a showtime to jump directly into the booking flow. You can also open `/booking` and make selections manually.

### 3. Step 1: Select Movie & Session
- Pick a film, cinema, hall, and date.
- Choose one of the available sessions.
- Click **Next** to continue.

### 4. Step 2: Select Seats
- The seating grid shows available seats.
- Occupied seats are disabled.
- Click any available seat to add/remove it.
- The booking summary on the right shows the total price.

### 5. Step 3: Contact Details
- Enter your full name and email (required).
- Phone number is optional.
- Card fields are present for demo purposes only; the backend does not store card data.
- Click **Confirm Booking** to finalize.

### 6. Booking Confirmation
After confirmation:
- A booking number (format `BK-xxxxxxxxxxxx`) is shown.
- The booking is stored in the system and can be retrieved by booking number.
- You are redirected back to the home page.

## Tips

- Make sure your session date is in the future.
- If no sessions are listed, refresh your data with `npm run add-sessions`.

## Troubleshooting

### “No sessions available”
Sessions may be out of date. Run:
```bash
npm run add-sessions
```

### “Seat already booked”
Another user booked the seat before you. Choose a different seat and try again.

## Technical Notes

- Seat availability is calculated from existing bookings for the session.
- Bookings are created using seat row/number pairs.
- Use `GET /api/bookings/:bookingNumber` to retrieve a booking.
