# Absolute Cinema

Absolute Cinema is a full-stack cinema booking project built with Node.js, Express, MongoDB, and Vue 3. It synchronizes films, schedules, and news from the Apollo Kino XML API and provides a booking flow plus an admin dashboard for sessions and bookings.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Frontend](#frontend)
- [Backend](#backend)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Database Management](#database-management)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Technologies Used](#technologies-used)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14 or higher recommended, tested with v20.19.5)
- **npm** (v6 or higher, comes with Node.js)
- **MongoDB** (v4.0 or higher) - Required for database operations

To check if you have Node.js and npm installed, run:

```bash
node --version
npm --version
```

To check if MongoDB is running:

```bash
mongosh --eval "db.version()"
```

## Installation

### Backend Installation

1. Clone the repository:
```bash
git clone https://github.com/lokr3m/absolute_cinema.git
cd absolute_cinema
```

2. Install backend dependencies:
```bash
npm install
```

This will install all required packages listed in `package.json`:
- `express` - Web framework
- `cors` - Cross-Origin Resource Sharing middleware
- `mongoose` - MongoDB object modeling
- `nodemon` - Auto-restart server during development
- `dotenv` - Environment variable loader
- `axios` - HTTP client for API requests
- `xml2js` - XML parsing for Apollo Kino feed

### Frontend Installation

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

This will install Vue 3, Vue Router, and Vite.

## Running the Project

### Backend

#### Production Mode

To start the backend server in production mode:

```bash
npm start
```

The server will start on `http://localhost:3000`

#### Development Mode

To start the backend server in development mode with auto-restart on file changes:

```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when you make changes to the code.

### Frontend

#### Development Mode

To start the frontend development server:

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

#### Production Build

To build the frontend for production:

```bash
cd frontend
npm run build
```

The built files will be in the `frontend/dist` directory.

## Frontend

The frontend is a Vue 3 application with the following features:

- **Home Page** (`/`) - Hero section with featured movies
- **Movies Page** (`/movies`) - Browse all movies with filtering options
- **Movie Detail Page** (`/movies/:id`) - Detailed movie information with showtimes
- **Booking Page** (`/booking`) - Multi-step booking process
- **Schedule Page** (`/schedule`) - Day-by-day schedule view
- **News Page** (`/news`) - Apollo Kino news feed
- **Admin Dashboard** (`/admin`) - Manage sessions, bookings, and synced cinemas (no authentication)

For more details, see [frontend/README.md](frontend/README.md).

## Backend

The backend is an Express API that stores data in MongoDB and optionally syncs cinema data from the Apollo Kino XML feeds. It provides:

- Public endpoints for films, sessions, cinemas, and seat layouts
- Booking endpoints for creating and retrieving bookings
- Admin endpoints for session CRUD and booking management (no authentication)
- Apollo Kino endpoints for syncing and debugging the upstream data feed

## Database Schema

This project includes a comprehensive database schema for a cinema booking system. The schema includes 7 main models:

- **User** - Optional user profiles (authentication not implemented yet)
- **Cinema** - Physical cinema locations
- **Hall** - Screening rooms within cinemas
- **Film** - Movie information and metadata
- **Session** - Movie showtimes and pricing
- **Seat** - Individual seats in halls
- **Booking** - Ticket reservations and payments

For detailed information about the database schema, including field descriptions, relationships, and usage examples, see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## Project Structure

```
absolute_cinema/
├── frontend/               # Vue.js frontend application
│   ├── src/
│   │   ├── components/    # Reusable Vue components
│   │   │   └── layout/    # Layout components (Header, Footer)
│   │   ├── views/         # Page components
│   │   │   ├── Home.vue
│   │   │   ├── Movies.vue
│   │   │   ├── MovieDetail.vue
│   │   │   ├── Booking.vue
│   │   │   ├── Schedule.vue
│   │   │   ├── News.vue
│   │   │   └── Admin.vue
│   │   ├── router/        # Vue Router configuration
│   │   ├── App.vue        # Root component
│   │   └── main.js        # Application entry point
│   ├── public/            # Static assets
│   ├── index.html         # HTML template
│   ├── vite.config.js     # Vite configuration
│   └── package.json       # Frontend dependencies
├── backend/
│   ├── Models/            # Database models (Mongoose schemas)
│   │   ├── User.js        # User model
│   │   ├── Cinema.js      # Cinema model
│   │   ├── Hall.js        # Hall model
│   │   ├── Film.js        # Film model
│   │   ├── Session.js     # Session model
│   │   ├── Seat.js        # Seat model
│   │   ├── Booking.js     # Booking model
│   │   └── index.js       # Models export file
│   ├── services/          # Apollo Kino API service
│   └── index.js           # Main server file with Express configuration
├── node_modules/          # Backend dependencies (not tracked in git)
├── .gitignore             # Git ignore rules
├── DATABASE_SCHEMA.md     # Database schema documentation
├── package.json           # Backend metadata and dependencies
├── package-lock.json  # Locked versions of dependencies
└── README.md          # This file
```

## Available Scripts

### Backend Scripts

- `npm start` - Starts the backend server in production mode
- `npm run dev` - Starts the backend server in development mode with nodemon
- `npm run seed` - Seeds the database with sample data (clears existing data)
- `npm run add-sessions` - Adds upcoming sessions without clearing existing data (recommended for production)
- `npm test` - Placeholder for tests (not yet implemented)

### Frontend Scripts

- `cd frontend && npm run dev` - Starts the frontend development server
- `cd frontend && npm run build` - Builds the frontend for production
- `cd frontend && npm run preview` - Preview the production build

## Database Management

### Seeding the Database

To populate the database with sample data:

```bash
npm run seed
```

**Warning:** This will delete all existing films, sessions, halls, and cinemas. Use this only for initial setup or testing.

### Refreshing Sessions

If your booking page shows "No sessions available", it likely means the sessions in your database are outdated. To add fresh sessions for the next 7 days without deleting existing bookings:

```bash
npm run add-sessions
```

This script will:
- Remove sessions older than today
- Add new sessions for the next 7 days
- Preserve all existing bookings and future sessions

**Note:** Make sure your `MONGODB_URI` environment variable is set before running these scripts.

## API Endpoints

### Public Data
- `GET /api/films`
- `GET /api/films/:id`
- `GET /api/films/:id/sessions`
- `GET /api/sessions` (supports `filmId`, `cinemaId`, `hallId`, `date`)
- `GET /api/sessions/:id/seats`
- `GET /api/cinemas`
- `GET /api/cinemas/:id/halls`

### Booking
- `POST /api/bookings`
- `GET /api/bookings/:bookingNumber`

### Admin (no auth)
- `GET /api/admin/sessions`
- `GET /api/admin/sessions/:id`
- `POST /api/admin/sessions`
- `PUT /api/admin/sessions/:id`
- `DELETE /api/admin/sessions/:id`
- `GET /api/admin/halls`
- `GET /api/admin/bookings`
- `DELETE /api/admin/bookings/:id`

### Apollo Kino Integration
- `GET /api/apollo-kino/sync`
- `GET /api/apollo-kino/raw`
- `GET /api/apollo-kino/events`
- `GET /api/apollo-kino/schedule`
- `GET /api/apollo-kino/TheatreAreas`
- `GET /api/apollo-kino/NewsCategories`
- `GET /api/apollo-kino/News`

## Troubleshooting

### "No sessions available for the selected criteria" on Booking Page

This error typically occurs when the sessions in your database are outdated. The booking system only shows sessions for current and future dates.

**Solution:**
```bash
npm run add-sessions
```

This will remove old sessions and create new ones for the next 7 days.

**Alternative:** If you want to start fresh with all sample data:
```bash
npm run seed
```

### MongoDB Connection Issues

If you see connection errors, ensure:

1. MongoDB is running:
   ```bash
   mongosh --eval "db.version()"
   ```

2. Your `MONGODB_URI` environment variable is set:
   ```bash
   # For local MongoDB
   export MONGODB_URI="mongodb://localhost:27017/cinema"
   
   # For MongoDB Atlas
   export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/cinema"
   ```

3. Check network connectivity and firewall settings

## Technologies Used

### Frontend

- **Vue 3** (v3.5.22) - Progressive JavaScript framework
- **Vue Router 4** (v4.6.3) - Official router for Vue.js
- **Vite** (v7.1.7) - Next generation frontend tooling

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** (v5.1.0) - Web application framework
- **CORS** (v2.8.5) - Middleware for enabling CORS
- **Mongoose** (v8.19.2) - MongoDB ODM
- **Nodemon** (v3.1.10) - Development tool for auto-restarting
- **Axios** (v1.13.2) - HTTP client
- **Dotenv** (v17.2.3) - Environment variable loader
- **xml2js** (v0.6.2) - XML parsing for Apollo Kino feeds

## License

ISC

## Contributing

For issues and questions, please use the [GitHub Issues](https://github.com/lokr3m/absolute_cinema/issues) page.
