# Absolute Cinema Frontend

A Vue 3 frontend for the Absolute Cinema booking experience. It integrates with the local backend and Apollo Kino data feeds for films, schedules, and news.

## Features

- **Home Page** - Hero section with featured movies
- **Movies Page** - Browse all movies with filtering and sorting options
- **Movie Detail Page** - Detailed movie information with showtimes
- **Booking Page** - Multi-step booking process (movie selection, seat selection, payment)
- **Schedule Page** - Day-by-day schedule view
- **News Page** - Apollo Kino news feed
- **Admin Dashboard** - Manage movies, sessions, bookings, and cinemas

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vue Router 4** - Official router for Vue.js
- **Vite** - Next generation frontend tooling

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

```bash
cd frontend
npm install
```

## Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

Build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Header.vue      # Navigation header
│   │       └── Footer.vue      # Footer component
│   ├── views/
│   │   ├── Home.vue           # Home page
│   │   ├── Movies.vue         # Movies listing page
│   │   ├── MovieDetail.vue    # Movie detail page
│   │   ├── Booking.vue        # Booking flow page
│   │   ├── Schedule.vue       # Schedule page
│   │   ├── News.vue           # News page
│   │   └── Admin.vue          # Admin dashboard
│   ├── router/
│   │   └── index.js           # Router configuration
│   ├── App.vue                # Root component
│   └── main.js                # Application entry point
├── public/                    # Static assets
├── index.html                 # HTML template
├── vite.config.js            # Vite configuration
└── package.json              # Dependencies and scripts
```

## Available Routes

- `/` - Home page
- `/movies` - All movies listing
- `/movies/:id` - Movie detail page
- `/booking` - Ticket booking
- `/schedule` - Schedule view
- `/news` - News feed
- `/admin` - Admin dashboard

## Design

The frontend design is inspired by Apollo Kino (apollokino.ee) with:
- Dark header and footer with red accent color (#e50914)
- Clean, modern card-based layouts
- Responsive grid systems
- Interactive hover effects
- Multi-step booking process

## Future Enhancements

- User authentication and role-based admin access
- Payment gateway integration
- Responsive mobile design improvements
- Movie search functionality
- User profile management
