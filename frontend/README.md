# Cinema Frontend

Vue 3 frontend for the cinema booking platform.

## What It Does

- Home page with featured movies
- Movies list + filtering
- Movie details with showtimes
- Multi-step booking flow
- Admin dashboard

## Tech Stack

- **Vue 3**
- **Vue Router**
- **Vite**

## Prerequisites

- Node.js (v14+)
- npm

## Setup

```bash
cd frontend
npm install
```

## Run

### Development
```bash
npm run dev
```
Open `http://localhost:5173`.

### Production Build
```bash
npm run build
```
Build output is in `dist/`.

### Preview
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Header.vue
│   │       └── Footer.vue
│   ├── views/
│   │   ├── Home.vue
│   │   ├── Movies.vue
│   │   ├── MovieDetail.vue
│   │   ├── Booking.vue
│   │   └── Admin.vue
│   ├── router/
│   │   └── index.js
│   ├── App.vue
│   └── main.js
├── public/
├── index.html
├── vite.config.js
└── package.json
```

## Routes

- `/` — Home
- `/movies` — Movies list
- `/movies/:id` — Movie details
- `/booking` — Booking flow
- `/admin` — Admin dashboard

## Design Notes

Inspired by the Apollo Kino visual style:
- Dark layout with red accents
- Card-based grids
- Responsive design
- Multi-step booking UI

## Future Enhancements (Ideas)

- Connect to live backend API
- User authentication
- Real data integration
- Payment gateway
- Improved mobile UX
- Search and filtering UX improvements