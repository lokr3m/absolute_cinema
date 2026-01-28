# Testing the Booking Feature

This guide explains how to test the newly implemented booking feature.

## Prerequisites

1. **MongoDB**: You need a MongoDB database (local or MongoDB Atlas)
2. **Node.js**: Version 14 or higher
3. **npm**: Package manager

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit the `.env` file and add your MongoDB connection string:

```
MONGODB_URI=mongodb://localhost:27017/cinema
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cinema?retryWrites=true&w=majority

PORT=3000
APOLLO_KINO_API_URL=https://www.apollokino.ee/xml
```

### 2. Install Dependencies

Install backend dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

### 3. Seed the Database

Populate the database with test data (creates cinemas, halls, seats, films, and sessions):

```bash
npm run seed
```

This will create:
- 2 cinemas (Apollo Kino Solaris, Apollo Kino Ülemiste)
- 3 halls with varying capacities
- Seats for each hall (including VIP seats)
- 3 films (Inception, The Dark Knight, Interstellar)
- Multiple sessions for today, tomorrow, and day after
- 1 test user

### 4. Start the Backend Server

```bash
npm run dev
```

The backend will start on `http://localhost:3000`

You should see:
```
✓ MongoDB connected successfully
Server started on http://localhost:3000
```

### 5. Start the Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is taken)

## Testing the Feature

### A. Manual Testing via UI

1. **Navigate to Movies Page**
   - Open `http://localhost:5173/movies` in your browser
   - You should see the list of films

2. **View Movie Details**
   - Click on any movie card
   - You should see the movie details page with showtimes

3. **Start Booking from Movie Detail**
   - Click the "Book Tickets" button OR
   - Click on a specific showtime button
   - You'll be redirected to the booking page

4. **Complete Booking Flow**
   
   **Step 1: Select Movie & Time**
   - If you clicked a specific showtime, this should be pre-selected
   - Otherwise, select a movie and session from the dropdowns
   - Click "Next"

   **Step 2: Select Seats**
   - View the seating chart
   - Available seats are white
   - VIP seats (middle rows) have a gold border
   - Already booked seats are gray (disabled)
   - Click on seats to select them (they turn red)
   - Select at least one seat
   - The summary on the right shows your total price
   - Click "Next"

   **Step 3: Payment**
   - Fill in your contact information (email is required)
   - Fill in dummy payment information
   - Click "Confirm Booking"
   - You should see a success message with your booking number

5. **Verify Seat Blocking**
   - Go back and try to book the same session
   - The seats you just booked should now be gray (occupied)

### B. API Testing

You can test the API endpoints directly using curl or Postman.

#### Test 1: Get Available Seats

First, get a session ID from the films endpoint:

```bash
# Get all films
curl http://localhost:3000/api/films

# Get sessions for a specific film (replace FILM_ID)
curl http://localhost:3000/api/films/FILM_ID/sessions

# Get seats for a session (replace SESSION_ID)
curl http://localhost:3000/api/sessions/SESSION_ID/seats
```

#### Test 2: Create a Booking

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "seatIds": ["SEAT_ID_1", "SEAT_ID_2"],
    "contactEmail": "test@example.com",
    "contactPhone": "+372 5555 5555"
  }'
```

#### Test 3: Get Booking Details

```bash
curl http://localhost:3000/api/bookings/BOOKING_ID
```

#### Test 4: Update Booking

```bash
curl -X PUT http://localhost:3000/api/bookings/BOOKING_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "paymentStatus": "paid",
    "paymentMethod": "card"
  }'
```

### C. Automated API Testing

Use the provided test script:

```bash
chmod +x /tmp/test_booking_api.sh
/tmp/test_booking_api.sh
```

This will automatically test all booking API endpoints and show the results.

## Expected Behavior

### Successful Booking

✅ You should be able to:
- Select a movie and session
- See the seating chart with real seat data
- Select multiple seats
- See the total price update automatically
- Complete the booking and receive a booking number

### Error Cases

❌ You should NOT be able to:
- Book seats that are already booked (409 Conflict error)
- Book sessions in the past (400 Bad Request error)
- Submit a booking without selecting seats (validation error)
- Submit a booking without an email (validation error)

### VIP Seats

💎 VIP seats should:
- Have a gold border in the UI
- Cost more than standard seats (€12.00 vs €8.50)
- Be located in the middle rows (rows 4-6)

## Troubleshooting

### Backend won't start
- Check that MongoDB is running
- Verify your MONGODB_URI in `.env` is correct
- Make sure port 3000 is available

### Frontend shows "Cannot connect to backend"
- Ensure the backend is running on `http://localhost:3000`
- Check browser console for CORS errors
- Verify the `VITE_API_URL` environment variable if set

### No films showing
- Run `npm run seed` to populate the database
- Check backend console for errors
- Verify MongoDB connection

### Seats not showing
- Make sure you've selected a session first
- Check browser console for API errors
- Verify the session has seats created in the database

### Cannot select seats
- Occupied seats (gray) cannot be selected
- Make sure the session is selected
- Check if the seats are marked as `isActive: false` in the database

## Test Scenarios

### Scenario 1: Happy Path
1. Navigate to Movies → Select a movie → Click on a showtime
2. Should land on booking page with session pre-selected at Step 2
3. Select 2 standard seats
4. Proceed to payment
5. Enter email: test@example.com
6. Confirm booking
7. Should receive booking number like "BK-1234567890-ABC123"

### Scenario 2: VIP Seats
1. Start booking flow
2. Select a VIP seat (gold border, rows 4-6)
3. Check that price is higher (€12.00 vs €8.50)
4. Complete booking
5. Total should reflect VIP pricing

### Scenario 3: Double Booking Prevention
1. Complete a booking for specific seats
2. Start a new booking for the same session
3. Previously booked seats should be gray and unclickable
4. Attempting to book them via API should return 409 Conflict

### Scenario 4: Multiple Seats
1. Select 4 different seats (mix of standard and VIP if available)
2. Check summary shows correct count and price
3. Complete booking
4. All 4 seats should be reserved

## Database Inspection

You can inspect the database directly:

```bash
# Using MongoDB Compass (GUI)
# Connect to: mongodb://localhost:27017/cinema

# Using mongo shell
mongo cinema
db.bookings.find().pretty()
db.sessions.find().pretty()
db.seats.find().pretty()
```

## Clean Up

To reset the database and start fresh:

```bash
npm run seed
```

This will clear all existing data and recreate the test data.

## Performance Testing

For load testing the API:

```bash
# Install apache bench (if not installed)
# Ubuntu/Debian: apt-get install apache2-utils
# Mac: brew install ab

# Test getting seats (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:3000/api/sessions/SESSION_ID/seats
```

## Next Steps

After successful testing:
1. Consider adding user authentication
2. Implement email notifications
3. Add booking cancellation functionality
4. Implement payment gateway integration
5. Add rate limiting for production (see SECURITY_SUMMARY.md)

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the backend console for errors
3. Verify your MongoDB connection
4. Ensure all dependencies are installed
5. Try running `npm run seed` again

For API documentation, see `docs/BOOKING_API.md`
For user guide, see `docs/BOOKING_GUIDE.md`
For security considerations, see `docs/SECURITY_SUMMARY.md`
