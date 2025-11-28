# Cinema Booking System - Database Schema

This document describes the database schema for the Cinema Booking System, a clone of Apollo Kino website functionality.

## Overview

The database is designed using MongoDB with Mongoose ODM. It consists of 7 main collections (models) that handle cinema operations, film management, session scheduling, seat allocation, and booking management.

## Entity Relationship Diagram

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  Cinema │────────▶│  Hall   │────────▶│  Seat   │
└─────────┘ 1:N     └─────────┘ 1:N     └─────────┘
                         │                    │
                         │ N:1                │ N:M
                         ▼                    ▼
┌─────────┐         ┌─────────┐         ┌─────────┐
│  Film   │────────▶│ Session │◀────────│ Booking │
└─────────┘ 1:N     └─────────┘ N:1     └─────────┘
                                              │
                                              │ N:1
                                              ▼
                                         ┌─────────┐
                                         │  User   │
                                         └─────────┘
```

## Models

### 1. User

Stores user account information for customers and administrators.

**Collection Name:** `users`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| firstName | String | Yes | User's first name |
| lastName | String | Yes | User's last name |
| email | String | Yes | User's email (unique, lowercase) |
| password | String | Yes | Hashed password |
| phone | String | No | User's phone number |
| role | String | Yes | User role: 'user' or 'admin' (default: 'user') |
| createdAt | Date | Auto | Account creation timestamp |

**Indexes:**
- email (unique)

---

### 2. Cinema

Represents physical cinema locations.

**Collection Name:** `cinemas`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| name | String | Yes | Cinema name |
| address.street | String | Yes | Street address |
| address.city | String | Yes | City name |
| address.postalCode | String | Yes | Postal code |
| address.country | String | Yes | Country (default: 'Estonia') |
| phone | String | No | Cinema contact phone |
| email | String | No | Cinema contact email |
| facilities | Array[String] | No | Available facilities (e.g., parking, cafe) |
| apolloKinoId | String | No | External ID from Apollo Kino API |
| createdAt | Date | Auto | Creation timestamp |

**Relationships:**
- One-to-Many with Hall

---

### 3. Hall

Represents screening rooms within cinemas.

**Collection Name:** `halls`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| cinema | ObjectId | Yes | Reference to Cinema |
| name | String | Yes | Hall name/number |
| capacity | Number | Yes | Total seating capacity (min: 1) |
| rows | Number | Yes | Number of rows (min: 1) |
| seatsPerRow | Number | Yes | Seats per row (min: 1) |
| screenType | String | Yes | Screen type: '2D', '3D', 'IMAX', '4DX', 'VIP' (default: '2D') |
| soundSystem | String | Yes | Sound system: 'Standard', 'Dolby Atmos', 'DTS:X' (default: 'Standard') |
| createdAt | Date | Auto | Creation timestamp |

**Relationships:**
- Many-to-One with Cinema
- One-to-Many with Seat
- One-to-Many with Session

---

### 4. Film

Stores information about movies available for screening.

**Collection Name:** `films`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| title | String | Yes | Film title (localized) |
| originalTitle | String | No | Original title in source language |
| description | String | Yes | Film synopsis |
| duration | Number | Yes | Duration in minutes (min: 1) |
| genre | Array[String] | Yes | Film genres |
| director | String | Yes | Director name |
| cast | Array[String] | No | Main cast members |
| releaseDate | Date | Yes | Film release date |
| language | String | Yes | Original language |
| subtitles | Array[String] | No | Available subtitle languages |
| ageRating | String | Yes | Age rating (G, PG, PG-13, R, NC-17, MS-6, MS-12, K-12, K-16) |
| posterUrl | String | No | URL to poster image |
| trailerUrl | String | No | URL to trailer video |
| rating | Number | No | Film rating (0-10) |
| isActive | Boolean | Yes | Whether film is currently showing (default: true) |
| apolloKinoId | String | No | External ID from Apollo Kino API |
| productionYear | Number | No | Year the film was produced |
| eventUrl | String | No | URL to the event page |
| createdAt | Date | Auto | Creation timestamp |

**Relationships:**
- One-to-Many with Session

---

### 5. Session

Represents scheduled film screenings.

**Collection Name:** `sessions`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| film | ObjectId | Yes | Reference to Film |
| hall | ObjectId | Yes | Reference to Hall |
| startTime | Date | Yes | Session start time |
| endTime | Date | Yes | Session end time |
| price.standard | Number | Yes | Standard ticket price (min: 0) |
| price.vip | Number | No | VIP ticket price (min: 0) |
| price.student | Number | No | Student discount price (min: 0) |
| price.child | Number | No | Child ticket price (min: 0) |
| is3D | Boolean | Yes | Whether session is 3D (default: false) |
| subtitles | String | No | Subtitle language for this session |
| availableSeats | Number | Yes | Number of available seats |
| status | String | Yes | Status: 'scheduled', 'cancelled', 'completed' (default: 'scheduled') |
| createdAt | Date | Auto | Creation timestamp |

**Relationships:**
- Many-to-One with Film
- Many-to-One with Hall
- One-to-Many with Booking

---

### 6. Seat

Represents individual seats in cinema halls.

**Collection Name:** `seats`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| hall | ObjectId | Yes | Reference to Hall |
| row | Number | Yes | Row number (min: 1) |
| number | Number | Yes | Seat number in row (min: 1) |
| seatType | String | Yes | Type: 'standard', 'vip', 'wheelchair' (default: 'standard') |
| isActive | Boolean | Yes | Whether seat is available for booking (default: true) |
| createdAt | Date | Auto | Creation timestamp |

**Indexes:**
- Compound unique index on (hall, row, number)

**Relationships:**
- Many-to-One with Hall
- Many-to-Many with Booking

---

### 7. Booking

Represents customer ticket reservations.

**Collection Name:** `bookings`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | Primary key |
| user | ObjectId | Yes | Reference to User |
| session | ObjectId | Yes | Reference to Session |
| seats | Array[ObjectId] | Yes | References to booked Seats |
| totalPrice | Number | Yes | Total booking price (min: 0) |
| bookingNumber | String | Yes | Unique booking reference number |
| status | String | Yes | Status: 'pending', 'confirmed', 'cancelled', 'completed' (default: 'pending') |
| paymentStatus | String | Yes | Payment: 'pending', 'paid', 'refunded' (default: 'pending') |
| paymentMethod | String | No | Payment method: 'card', 'cash', 'online' |
| contactEmail | String | Yes | Contact email for booking |
| contactPhone | String | No | Contact phone number |
| createdAt | Date | Auto | Booking creation timestamp |
| updatedAt | Date | Auto | Last update timestamp |

**Indexes:**
- bookingNumber (unique)

**Relationships:**
- Many-to-One with User
- Many-to-One with Session
- Many-to-Many with Seat

---

## Key Features

### Data Integrity
- Foreign key relationships enforced through Mongoose references
- Unique constraints on emails, booking numbers, and seat positions
- Validation rules for required fields and enums
- Minimum value constraints for numeric fields

### Scalability
- Indexed fields for efficient queries (email, bookingNumber)
- Compound indexes for seat uniqueness
- Separated concerns with normalized data structure

### Business Logic Support
- Multiple pricing tiers (standard, VIP, student, child)
- Seat type differentiation (standard, VIP, wheelchair)
- Booking and payment status tracking
- Film and session scheduling flexibility
- Multi-language and subtitle support

## Usage Examples

### Creating a Cinema with Hall
```javascript
const { Cinema, Hall } = require('./models');

// Create cinema
const cinema = await Cinema.create({
  name: 'Apollo Kino Solaris',
  address: {
    street: 'Estonia pst 9',
    city: 'Tallinn',
    postalCode: '10143',
    country: 'Estonia'
  },
  phone: '+372 680 9090',
  facilities: ['Parking', 'Cafe', '3D']
});

// Create hall
const hall = await Hall.create({
  cinema: cinema._id,
  name: 'Hall 1',
  capacity: 200,
  rows: 10,
  seatsPerRow: 20,
  screenType: 'IMAX',
  soundSystem: 'Dolby Atmos'
});
```

### Creating a Film
```javascript
const { Film } = require('./models');

const film = await Film.create({
  title: 'Inception',
  originalTitle: 'Inception',
  description: 'A thief who steals corporate secrets through dream-sharing technology...',
  duration: 148,
  genre: ['Action', 'Sci-Fi', 'Thriller'],
  director: 'Christopher Nolan',
  cast: ['Leonardo DiCaprio', 'Ellen Page', 'Tom Hardy'],
  releaseDate: new Date('2010-07-16'),
  language: 'English',
  subtitles: ['Estonian', 'Russian'],
  ageRating: 'PG-13',
  rating: 8.8,
  isActive: true
});
```

### Creating a Session
```javascript
const { Session } = require('./models');

const session = await Session.create({
  film: film._id,
  hall: hall._id,
  startTime: new Date('2024-01-20T19:00:00'),
  endTime: new Date('2024-01-20T21:30:00'),
  price: {
    standard: 8.50,
    student: 6.00,
    child: 5.00
  },
  is3D: false,
  subtitles: 'Estonian',
  availableSeats: 200,
  status: 'scheduled'
});
```

### Creating a Booking
```javascript
const { Booking } = require('./models');

const booking = await Booking.create({
  user: user._id,
  session: session._id,
  seats: [seat1._id, seat2._id],
  totalPrice: 17.00,
  bookingNumber: 'BK-' + Date.now(),
  status: 'confirmed',
  paymentStatus: 'paid',
  paymentMethod: 'card',
  contactEmail: 'customer@example.com',
  contactPhone: '+372 5555 5555'
});
```

## Database Connection

To connect to MongoDB, add this to your `index.js`:

```javascript
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/cinema')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
```

## Environment Variables

Consider using environment variables for sensitive data:

```
MONGODB_URI=mongodb://localhost:27017/cinema
PORT=3000
```

## Notes

- All models use Mongoose Schema with appropriate validation
- Timestamps are automatically managed where needed
- References between models use ObjectId for relationships
- Password fields should be hashed before storage (consider using bcrypt)
- Consider implementing virtual fields for computed properties
- Consider adding indexes for frequently queried fields