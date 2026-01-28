# Booking Feature Guide

This guide explains how to use the new booking feature in the Absolute Cinema application.

## Overview

The booking feature allows users to:
- Browse available movies and showtimes
- Select seats for a specific session
- Complete the booking process with payment information
- Receive a booking confirmation number

## User Flow

### 1. Browse Movies

Navigate to the Movies page to see all available films. Click on any movie to view its details.

### 2. View Movie Details

On the movie detail page, you can:
- See information about the film (title, description, cast, director, etc.)
- View available showtimes organized by date and cinema
- Click the "Book Tickets" button to start the booking process

### 3. Select Session

Click on any showtime button to proceed to the booking page with that session pre-selected. The showtime buttons display:
- Time of the session
- Hall name
- Ticket price

### 4. Booking Process

The booking page has three steps:

#### Step 1: Select Movie & Time
- If you came from a movie detail page, the film and session are already selected
- Otherwise, select a movie from the dropdown
- Choose a session from the available options
- Click "Next" to proceed

#### Step 2: Select Seats
- View the seating chart for the selected hall
- Available seats are shown in white
- VIP seats (premium) are shown with a gold border
- Already booked seats are shown in gray and cannot be selected
- Click on seats to select/deselect them
- Selected seats turn red
- You can select multiple seats
- The booking summary on the right shows your selection and total price
- Click "Next" when you've selected your seats

#### Step 3: Payment Details
- Enter your contact information:
  - Full name
  - Email address (required for booking confirmation)
  - Phone number (optional)
- Enter payment information:
  - Card number
  - Expiry date
  - CVV
- Review your booking summary
- Click "Confirm Booking" to complete the booking

### 5. Booking Confirmation

After successfully completing the booking:
- You'll receive a booking number (format: BK-TIMESTAMP-RANDOMID)
- This number can be used to retrieve your booking later
- You'll be redirected to the home page

## Features

### Real-time Seat Availability

- Seats that are already booked are shown as occupied and cannot be selected
- The system prevents double-booking of seats
- Available seat count is updated automatically

### Price Calculation

- Standard seats: Base price (e.g., €8.50)
- VIP seats: Premium price (e.g., €12.00)
- Total price is calculated automatically based on selected seats

### Guest Booking

- You don't need to create an account to make a booking
- Guest users are created automatically with your email
- Future enhancement will add user accounts for booking history

## Seat Types

### Standard Seats
- Regular cinema seats
- Base ticket price applies

### VIP Seats
- Premium seating (typically in middle rows)
- Higher ticket price
- Better viewing angles
- More comfortable seating

### Wheelchair Accessible
- Special seating for wheelchair users
- Same price as standard seats

## Navigation

You can access the booking feature through:

1. **Direct Link**: Visit `/booking` in the navigation
   - Allows you to select any movie and session

2. **Movie Detail Page**: 
   - Browse movies → Click on a movie → Click "Book Tickets"
   - Pre-selects the movie

3. **Showtime Button**: 
   - Browse movies → Click on a movie → Click on a specific showtime
   - Pre-selects both movie and session, takes you directly to seat selection

## Tips

- **Book Early**: Popular showtimes fill up quickly
- **VIP Seats**: Center rows (typically rows 4-6) offer the best viewing experience
- **Arrive Early**: We recommend arriving 15 minutes before showtime
- **Check Subtitles**: Session details show if subtitles are available

## Troubleshooting

### "Seats already booked" Error
If you get this error, it means someone else booked those seats just before you. Please select different seats.

### Unable to Select Seats
Make sure you've selected a movie and session in Step 1 first.

### Booking Not Saving
Check that you've filled in all required fields (email is required). If the problem persists, try refreshing the page and starting over.

## Technical Details

For developers and technical users:

- The booking system uses a RESTful API
- Seat availability is checked server-side to prevent race conditions
- Bookings are stored in MongoDB
- Guest users are created automatically for bookings without user accounts

See `BOOKING_API.md` for detailed API documentation.

## Future Features

Planned enhancements:
- User accounts with booking history
- Email confirmation with QR code
- Ability to cancel/modify bookings
- Payment gateway integration
- Booking search by confirmation number
- Special offers and discounts
- Group bookings
