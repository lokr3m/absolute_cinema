# Testing Absolute Cinema

This guide explains how to validate the booking flow and API endpoints.

## Prerequisites

- MongoDB (local or Atlas)
- Node.js 14+ and npm

## Environment Setup

Create a `.env` file in the project root (or export environment variables) with:

```
MONGODB_URI=mongodb://localhost:27017/cinema
PORT=3000
APOLLO_KINO_API_URL=https://www.apollokino.ee/xml
```

## Install Dependencies

```bash
npm install
cd frontend
npm install
cd ..
```

## Seed Sample Data

Populate the database with sample cinemas, halls, films, and sessions:

```bash
npm run seed
```

If sessions expire over time, refresh them with:

```bash
npm run add-sessions
```

## Start the App

Backend:
```bash
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## Manual UI Testing

1. Open `http://localhost:5173`
2. Browse movies and open a movie detail page
3. Click a showtime to open `/booking`
4. Select seats and complete the booking form
5. Confirm the booking and note the booking number
6. Open the **Admin** page to verify the booking appears

## API Testing

### Get Films and Sessions
```bash
curl http://localhost:3000/api/films
curl http://localhost:3000/api/films/FILM_ID/sessions
```

### Get Seat Layout
```bash
curl http://localhost:3000/api/sessions/SESSION_ID/seats
```

### Create a Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "seats": [{ "row": 4, "number": 7 }],
    "contactEmail": "test@example.com",
    "contactPhone": "+372 5555 5555"
  }'
```

### Retrieve a Booking
```bash
curl http://localhost:3000/api/bookings/BK-XXXXXXXX
```

## Automated Tests

Automated tests are not implemented yet. Manual testing is currently the primary verification method.
