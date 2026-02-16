# TA23B-B5 Cinema Booking Platform

A full-stack cinema booking system built with **Node.js**, **Express**, **MongoDB**, and **Vue 3**.  
This project is a school project for **Tallinna Polütehnikum**.

## Overview

The platform provides:
- A public website to browse movies and showtimes.
- A simulated booking flow with seat selection and confirmation.
- An admin interface to manage films, halls, sessions, and bookings.

## Tech Stack

**Backend**
- Node.js
- Express.js
- MongoDB + Mongoose
- CORS
- Nodemon (dev)

**Frontend**
- Vue 3
- Vue Router
- Vite

## Repository Structure

```
TA23B-B5-projekt/
├── backend/            # Express + Mongoose backend
├── frontend/           # Vue 3 frontend
├── docs/               # Specifications and documentation
├── DATABASE_SCHEMA.md  # DB schema reference
└── README.md           # This file
```

## Prerequisites

- **Node.js** (v14+ recommended; tested with v20)
- **npm**
- **MongoDB** (v4+)

Check versions:

```bash
node --version
npm --version
mongosh --eval "db.version()"
```

## Quick Start

### 1) Install backend dependencies
```bash
npm install
```

### 2) Start backend
```bash
npm start
```
Backend runs on `http://localhost:3000`.

### 3) Install frontend dependencies
```bash
cd frontend
npm install
```

### 4) Start frontend
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`.

## Available Scripts

**Backend**
- `npm start` — production mode
- `npm run dev` — development mode (nodemon)
- `npm test` — placeholder

**Frontend**
- `cd frontend && npm run dev`
- `cd frontend && npm run build`
- `cd frontend && npm run preview`

## API

Currently documented endpoint:
- `GET /` — returns a static string.

Example:
```bash
curl http://localhost:3000/
```

## Documentation

- Product & requirements: `docs/SRS.md`
- Database schema: `DATABASE_SCHEMA.md`
- Frontend details: `frontend/README.md`

## License

ISC

## Contributing

This is a school project for Tallinna Polütehnikum.  
Use GitHub Issues for questions and tracking:  
https://github.com/Tallinna-Polutehnikum/TA23B-B5-projekt/issues