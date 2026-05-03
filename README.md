# TA23B-B5 Cinema Booking Platform

Full-stack cinema booking platform with:
- public movie/session browsing
- booking flow with seat selection
- admin API for movies, sessions, halls, and bookings
- Apollo Kino schedule/data sync endpoints

This project is a school project for **Tallinna Polütehnikum**.

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Axios + xml2js (Apollo API integration)
- express-rate-limit

**Frontend**
- Vue 3
- Vue Router
- Vite

## Repository Structure

```text
TA23B-B5-projekt/
├── backend/            # Express API + MongoDB models/services
├── frontend/           # Vue 3 client app
├── docs/               # Project docs
├── DATABASE_SCHEMA.md  # DB schema reference
├── .env.example        # Environment variables template
└── README.md
```

## Prerequisites

- Node.js 18+ (recommended: 20+)
- npm
- MongoDB Atlas connection string (or local MongoDB)

## Environment Setup

1. Copy environment template:

```bash
cp .env.example .env
```

2. Set required variables in `.env`:

```env
MONGODB_URI=...
PORT=3000
HOST=127.0.0.1
JWT_SECRET=...
ADMIN_EMAIL=admin@kino.local
ADMIN_PASSWORD=...
APOLLO_KINO_API_URL=https://www.apollokino.ee/xml
```

> Backend exits on startup if `MONGODB_URI` is missing.

## Quick Start

### 1) Install dependencies

```bash
npm install
cd frontend && npm install
```

### 2) (Optional) Seed database with sample data

```bash
npm run seed
```

### 3) Start backend

```bash
npm run dev
```

Backend: `http://127.0.0.1:3000`

### 4) Start frontend (new terminal)

```bash
cd frontend
npm run dev
```

Frontend: `http://localhost:5173`

## Available Scripts

### Root (backend)

- `npm start` — run backend
- `npm run dev` — run backend with nodemon
- `npm run seed` — seed database with sample cinemas/films/sessions
- `npm run add-sessions` — utility script for session generation
- `npm test` — placeholder (currently returns error by design)

### Frontend

- `cd frontend && npm run dev`
- `cd frontend && npm run build`
- `cd frontend && npm run preview`

## API Overview

Base URL: `http://127.0.0.1:3000`

### Health / root
- `GET /`

### Public data
- `GET /api/films`
- `GET /api/films/:id`
- `GET /api/sessions`
- `GET /api/sessions/:id/seats`
- `GET /api/cinemas`
- `GET /api/cinemas/:id/halls`
- `GET /api/films/:id/sessions`

### Booking
- `POST /api/bookings`
- `GET /api/bookings/:bookingNumber`

### Apollo Kino integration
- `GET /api/apollo-kino/sync`
- `GET /api/apollo-kino/sync-cinemas`
- `GET /api/apollo-kino/raw`
- `GET /api/apollo-kino/events`
- `GET /api/apollo-kino/schedule`
- `GET /api/apollo-kino/TheatreAreas`
- `GET /api/apollo-kino/NewsCategories`
- `GET /api/apollo-kino/News`

### Admin API
- Note: admin endpoints use legacy `/movies` naming, while public endpoints use `/films`; both refer to the same movie entities.
- Auth:
  - `POST /api/admin/auth/login` (returns Bearer token, token lifetime 60 minutes)
  - `GET /api/admin/auth/me` (current admin profile)
  - All `/api/admin/*` endpoints require `Authorization: Bearer <token>`
  - Failed login lockout: after 5 incorrect password attempts, account is locked for 15 minutes
  - Roles: `admin` (read/write), `manager` (read-only admin API)
  - If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`, backend bootstraps/updates this admin user on startup
  - `POST /api/admin/admins` (primary admin only) — create new admin or manager accounts
- `GET/POST /api/admin/movies`
- `PUT/DELETE /api/admin/movies/:id`
- `GET/POST /api/admin/sessions`
- `GET/PUT/DELETE /api/admin/sessions/:id`
- `GET/POST /api/admin/halls`
- `PUT/DELETE /api/admin/halls/:id`
- `GET /api/admin/halls/:id/seats`
- `POST /api/admin/halls/:id/seats/generate`
- `GET /api/admin/bookings`
- `DELETE /api/admin/bookings/:id`

## Documentation

- Requirements/spec: `docs/SRS.md`
- Database schema: `DATABASE_SCHEMA.md`
- Frontend README: `frontend/README.md`

## License

ISC
