require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Film, Session, Cinema, Hall } = require('./Models');
const ApolloKinoService = require('./services/apolloKinoService');

const app = express();
app.use(cors()); // чтобы Vue мог обращаться к API
app.use(express.json()); // для парсинга JSON тела запросов

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not set in environment variables');
  console.error('Please copy .env.example to .env and configure your MongoDB Atlas connection string');
  console.error('See QUICKSTART.md for setup instructions');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    const dbName = MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'MongoDB';
    console.log(`✓ ${dbName} connected successfully`);
  })
  .catch(err => {
    console.warn('⚠️  MongoDB connection error:', err.message);
    console.warn('Continuing without database connection - only mock data will be available');
  });

// Initialize Apollo Kino Service
const apolloKinoService = new ApolloKinoService();

// Роуты

app.get('/', async (req, res) => {
  const users = 'abbik';
  res.json(users);
});

// Public Read API Endpoints

/**
 * GET /api/films
 * List all active films
 * Query parameters:
 *   - genre: Filter by genre
 *   - ageRating: Filter by age rating
 *   - limit: Number of results to return (default: all)
 */
app.get('/api/films', async (req, res) => {
  try {
    const { genre, ageRating, limit } = req.query;
    
    // Build query filter
    const filter = { isActive: true };
    if (genre) {
      filter.genre = genre;
    }
    if (ageRating) {
      filter.ageRating = ageRating;
    }

    // Query database
    let query = Film.find(filter).sort({ releaseDate: -1 });
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const films = await query;
    
    res.json({
      success: true,
      count: films.length,
      data: films
    });
  } catch (error) {
    console.error('Error fetching films:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch films'
    });
  }
});

/**
 * GET /api/films/:id
 * Get detailed information about a specific film
 */
app.get('/api/films/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid film ID'
      });
    }

    const film = await Film.findById(id);

    if (!film) {
      return res.status(404).json({
        success: false,
        error: 'Film not found'
      });
    }

    res.json({
      success: true,
      data: film
    });
  } catch (error) {
    console.error('Error fetching film:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch film'
    });
  }
});

/**
 * GET /api/sessions
 * List all scheduled sessions
 * Query parameters:
 *   - filmId: Filter by film ID
 *   - date: Filter by date (YYYY-MM-DD)
 *   - hallId: Filter by hall ID
 */
app.get('/api/sessions', async (req, res) => {
  try {
    const { filmId, date, hallId } = req.query;
    
    // Build query filter
    const filter = { status: 'scheduled' };
    
    if (filmId) {
      if (!mongoose.Types.ObjectId.isValid(filmId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid film ID'
        });
      }
      filter.film = filmId;
    }
    
    if (hallId) {
      if (!mongoose.Types.ObjectId.isValid(hallId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid hall ID'
        });
      }
      filter.hall = hallId;
    }
    
    if (date) {
      // Filter sessions for the specified date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.startTime = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else {
      // By default, only show future sessions
      filter.startTime = { $gte: new Date() };
    }

    // Query database with populated references
    const sessions = await Session.find(filter)
      .populate('film', 'title originalTitle duration genre ageRating posterUrl rating language subtitles')
      .populate({
        path: 'hall',
        select: 'name cinema screenType soundSystem capacity',
        populate: {
          path: 'cinema',
          select: 'name address'
        }
      })
      .sort({ startTime: 1 });

    res.json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

/**
 * GET /api/cinemas
 * List all cinemas
 */
app.get('/api/cinemas', async (req, res) => {
  try {
    const cinemas = await Cinema.find().sort({ name: 1 });
    
    res.json({
      success: true,
      count: cinemas.length,
      data: cinemas
    });
  } catch (error) {
    console.error('Error fetching cinemas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cinemas'
    });
  }
});

/**
 * GET /api/films/:id/sessions
 * Get all scheduled sessions for a specific film
 */
app.get('/api/films/:id/sessions', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid film ID'
      });
    }

    // Check if film exists
    const film = await Film.findById(id);
    if (!film) {
      return res.status(404).json({
        success: false,
        error: 'Film not found'
      });
    }

    // Get all scheduled sessions for this film (future sessions only)
    const sessions = await Session.find({
      film: id,
      status: 'scheduled',
      startTime: { $gte: new Date() }
    })
      .populate('hall', 'name cinema screenType soundSystem')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      film: {
        id: film._id,
        title: film.title,
        duration: film.duration
      },
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    console.error('Error fetching film sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch film sessions'
    });
  }
});

/**
 * GET /api/apollo-kino/sync
 * Fetch and sync data from Apollo Kino API to database
 * This endpoint fetches movies and sessions from Apollo Kino and stores them in the database
 */
app.get('/api/apollo-kino/sync', async (req, res) => {
  try {
    const data = await apolloKinoService.fetchSchedule();
    
    if (data.error) {
      return res.status(503).json({
        success: false,
        error: 'Failed to fetch Apollo Kino data',
        message: data.error
      });
    }

    const syncResults = {
      movies: { added: 0, updated: 0, errors: [] },
      sessions: { added: 0, errors: [] }
    };

    // Process movies
    for (const movie of data.movies) {
      try {
        const filmData = apolloKinoService.transformMovieToFilm(movie);
        
        // Check if film already exists by title
        const existingFilm = await Film.findOne({ 
          originalTitle: filmData.originalTitle 
        });

        if (existingFilm) {
          // Update existing film
          await Film.findByIdAndUpdate(existingFilm._id, filmData);
          syncResults.movies.updated++;
        } else {
          // Create new film
          await Film.create(filmData);
          syncResults.movies.added++;
        }
      } catch (error) {
        console.error('Error processing movie:', error);
        syncResults.movies.errors.push({
          title: movie.Title || movie.OriginalTitle,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Apollo Kino data sync completed',
      results: syncResults,
      totalMovies: data.movies.length,
      totalShows: data.shows.length
    });
  } catch (error) {
    console.error('Error syncing Apollo Kino data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync Apollo Kino data',
      message: error.message
    });
  }
});

/**
 * GET /api/apollo-kino/raw
 * Get raw Apollo Kino API data (for debugging)
 */
app.get('/api/apollo-kino/raw', async (req, res) => {
  try {
    const data = await apolloKinoService.fetchData();
    res.json({
      success: true,
      data: data.raw,
      error: data.error || null
    });
  } catch (error) {
    console.error('Error fetching Apollo Kino raw data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Apollo Kino data',
      message: error.message
    });
  }
});

/**
 * GET /api/apollo-kino/events
 * Get movie events from Apollo Kino API
 * Returns transformed movie data from the Events endpoint
 */
app.get('/api/apollo-kino/events', async (req, res) => {
  try {
    const events = await apolloKinoService.fetchEvents();
    
    // Transform events to film format
    const films = events.map(event => apolloKinoService.transformEventToFilm(event));
    
    res.json({
      success: true,
      count: films.length,
      movies: films
    });
  } catch (error) {
    console.error('Error fetching Apollo Kino events:', error);
  }
});
/**
 * GET /api/apollo-kino/schedule
 * Get schedule data from Apollo Kino API
 * Returns movies and shows data from the Schedule endpoint
 * Query parameters:
 *   - area: Theatre Area ID (optional)
 *   - dt: Date in dd.mm.yyyy format (optional)
 *   - nrOfDays: Number of days to fetch, 1-31 (optional, defaults to 14)
 */
app.get('/api/apollo-kino/schedule', async (req, res) => {
  try {
    const { area, dt, nrOfDays } = req.query;
    
    // Build options for fetchSchedule
    // Parse nrOfDays as integer, default to 14 days to cover two weeks
    const parsedNrOfDays = nrOfDays ? parseInt(nrOfDays, 10) : 14;
    const options = {
      nrOfDays: (parsedNrOfDays >= 1 && parsedNrOfDays <= 31) ? parsedNrOfDays : 14
    };
    if (area) options.area = area;
    if (dt) options.dt = dt;
    
    const data = await apolloKinoService.fetchSchedule(options);
    
    if (data.error) {
      return res.status(503).json({
        success: false,
        error: 'Failed to fetch Apollo Kino schedule data',
        message: data.error
      });
    }

    res.json({
      success: true,
      movies: data.movies,
      shows: data.shows,
      schedule: data.schedule,
      events: data.events
    });
  } catch (error) {
    console.error('Error fetching Apollo Kino schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Apollo Kino schedule',
      message: error.message
    });
  }
});

/**
 * GET /api/apollo-kino/TheatreAreas
 * Get theatre areas from Apollo Kino API
 * Returns list of available cinemas/theatre areas
 */
app.get('/api/apollo-kino/TheatreAreas', async (req, res) => {
  try {
    const theatreAreas = await apolloKinoService.fetchTheatreAreas();
    
    res.json({
      success: true,
      count: theatreAreas.length,
      data: theatreAreas
    });
  } catch (error) {
    console.error('Error fetching Apollo Kino Theatre Areas:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
