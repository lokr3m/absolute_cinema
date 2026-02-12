require("node:dns").setServers(["1.1.1.1", "8.8.8.8"]);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { Film, Session, Cinema, Hall, Booking, Seat } = require('./Models');
const ApolloKinoService = require('./services/apolloKinoService');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;
const BOOKING_ID_BYTES = 6;
const DEFAULT_COUNTRY = 'Estonia';

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not set in environment variables');
  process.exit(1);
}

const apolloKinoService = new ApolloKinoService();

const normalizeApolloId = value => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const mapCinemaToTheatreArea = cinema => {
  const apolloId = cinema.apolloId ?? null;
  return {
    ID: apolloId,
    id: apolloId,
    Name: cinema.name,
    Address: cinema.address?.street,
    City: cinema.address?.city,
    PostalCode: cinema.address?.postalCode,
    Phone: cinema.phone,
    Email: cinema.email,
    Facilities: cinema.facilities,
    _id: cinema._id,
    name: cinema.name,
    address: cinema.address,
    apolloId
  };
};

const normalizeToArray = value => (Array.isArray(value) ? value : [value]);

const extractShowsFromSchedule = schedulePayload => {
  if (!schedulePayload) return [];
  // Apollo schedule responses may include { Schedule: { Shows: ... } }.
  const nestedScheduleShows = schedulePayload.Schedule?.Shows?.Show;
  if (nestedScheduleShows != null) {
    return normalizeToArray(nestedScheduleShows);
  }
  // Apollo schedule responses may include { Shows: { Show: ... } }.
  const directShows = schedulePayload.Shows?.Show;
  if (directShows != null) {
    return normalizeToArray(directShows);
  }
  // Apollo schedule responses may include { Shows: [...] }.
  if (Array.isArray(schedulePayload.Shows)) {
    return schedulePayload.Shows;
  }
  // Apollo schedule responses may return an array of shows directly.
  if (Array.isArray(schedulePayload)) {
    return schedulePayload;
  }
  return [];
};

/**
 * Refresh database with fresh data from Apollo Kino API
 * Clears all existing data and populates from API
 */
async function refreshDatabaseFromApollo() {
  console.log('🔄 Starting database refresh from Apollo Kino API...');
  
  try {
    // Step 1: Clear all existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Booking.deleteMany({}),
      Seat.deleteMany({}),
      Session.deleteMany({}),
      Film.deleteMany({}),
      Hall.deleteMany({}),
      Cinema.deleteMany({})
    ]);
    console.log('✓ Cleared all existing data');

    // Step 2: Fetch Theatre Areas and create Cinemas/Halls
    console.log('📍 Fetching Theatre Areas...');
    const theatreAreas = await apolloKinoService.fetchTheatreAreas();
    console.log(`✓ Found ${theatreAreas.length} theatre areas`);

    const cinemaMap = new Map(); // Map Apollo cinema ID to MongoDB cinema
    const hallMap = new Map(); // Map Apollo hall/auditorium ID to MongoDB hall

    for (const area of theatreAreas) {
      try {
        // Create cinema from theatre area
        const cinemaData = {
          apolloId: normalizeApolloId(area.ID),
          name: area.Name || `Apollo Kino ${area.ID}`,
          address: {
            street: area.Address || 'Unknown',
            city: area.City || 'Tallinn',
            postalCode: area.PostalCode || '10000',
            country: DEFAULT_COUNTRY
          },
          phone: area.Phone || '',
          email: area.Email || 'info@apollokino.ee',
          facilities: ['3D', 'Dolby Atmos', 'Parking']
        };

        const cinema = await Cinema.create(cinemaData);
        cinemaMap.set(area.ID, cinema);
        console.log(`  ✓ Created cinema: ${cinema.name}`);

        // Create default halls for each cinema (3 halls per cinema)
        for (let i = 1; i <= 3; i++) {
          const hallData = {
            cinema: cinema._id,
            name: `Hall ${i}`,
            capacity: 100 + (i * 50),
            rows: 8 + i,
            seatsPerRow: 12 + i,
            screenType: i === 1 ? 'IMAX' : (i === 2 ? '3D' : 'Standard'),
            soundSystem: i <= 2 ? 'Dolby Atmos' : 'Digital 5.1'
          };
          const hall = await Hall.create(hallData);
          hallMap.set(`${area.ID}-${i}`, hall);
        }
      } catch (err) {
        console.error(`  ⚠️ Error creating cinema for area ${area.ID}:`, err.message);
      }
    }

    // If no theatre areas found, create default cinema
    if (theatreAreas.length === 0) {
      console.log('  ℹ️ No theatre areas from API, creating default cinema...');
      const defaultCinema = await Cinema.create({
        apolloId: null,
        name: 'Apollo Kino Solaris',
        address: { street: 'Estonia pst 9', city: 'Tallinn', postalCode: '10143', country: DEFAULT_COUNTRY },
        phone: '+372 6273 500',
        email: 'info@apollokino.ee',
        facilities: ['IMAX', '3D', 'Dolby Atmos', 'Parking']
      });
      cinemaMap.set('default', defaultCinema);
      
      for (let i = 1; i <= 3; i++) {
        const hall = await Hall.create({
          cinema: defaultCinema._id,
          name: `Hall ${i}`,
          capacity: 100 + (i * 50),
          rows: 8 + i,
          seatsPerRow: 12 + i,
          screenType: i === 1 ? 'IMAX' : (i === 2 ? '3D' : 'Standard'),
          soundSystem: i <= 2 ? 'Dolby Atmos' : 'Digital 5.1'
        });
        hallMap.set(`default-${i}`, hall);
      }
    }

    // Step 3: Fetch Events and create Films
    console.log('🎬 Fetching Events (Films)...');
    const events = await apolloKinoService.fetchEvents();
    console.log(`✓ Found ${events.length} events`);

    const filmMap = new Map(); // Map Apollo event ID to MongoDB film

    for (const event of events) {
      try {
        const filmData = apolloKinoService.transformEventToFilm(event);
        const film = await Film.create(filmData);
        const apolloId = normalizeApolloId(event.ID);
        if (apolloId) {
          filmMap.set(apolloId, film);
        }
      } catch (err) {
        console.error(`  ⚠️ Error creating film for event ${event.ID}:`, err.message);
      }
    }
    console.log(`✓ Created ${filmMap.size} films`);

    // Step 4: Fetch Schedule and create Sessions
    console.log('📅 Fetching Schedule...');
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    
    const dtFrom = formatDateLocal(today);
    const dtTo = formatDateLocal(twoWeeksLater);
    
    const scheduleData = await apolloKinoService.fetchSchedule(dtFrom, dtTo);
    
    let sessionsCreated = 0;
    
    // Process schedule shows if available
    const shows = extractShowsFromSchedule(scheduleData.schedule);

    if (shows.length > 0) {
      console.log(`✓ Found ${shows.length} shows in schedule`);

      // Get all halls as array for random assignment
      const allHalls = Array.from(hallMap.values());

      for (const show of shows) {
        try {
          // Find or create the film by event ID
          const apolloId = normalizeApolloId(show.EventID);
          let film = apolloId ? filmMap.get(apolloId) : null;
          
          // If film not found in events, create it from show data
          if (!film && show.Title) {
            try {
              const ageRatingMap = {
                'MS-6': 'MS-6',
                'MS-12': 'MS-12',
                'K-12': 'K-12',
                'K-14': 'K-14',
                'K-16': 'K-16',
                'PERE': 'G',
                'L': 'G',
                '-': 'G',
                '': 'G'
              };
              
              const genres = show.Genres ? show.Genres.split(',').map(g => g.trim()) : ['General'];
              
              const filmData = {
                title: show.Title,
                originalTitle: show.OriginalTitle || show.Title,
                description: show.Synopsis || 'No description available',
                duration: parseInt(show.LengthInMinutes) || 90,
                genre: genres,
                director: 'Unknown',
                cast: [],
                releaseDate: show.dtLocalRelease ? new Date(show.dtLocalRelease) : new Date(),
                language: show.SpokenLanguage?.Name || 'Unknown',
                subtitles: show.SubtitleLanguage1?.Name ? [show.SubtitleLanguage1.Name] : [],
                ageRating: ageRatingMap[show.RatingLabel] || 'G',
                posterUrl: show.Images?.EventMediumImagePortrait || '',
                trailerUrl: '',
                rating: 0,
                isActive: true
              };
              
              film = await Film.create(filmData);
              if (apolloId) {
                filmMap.set(apolloId, film);
              }
            } catch (filmErr) {
              // Skip if film creation fails
              continue;
            }
          }
          
          if (!film) continue;
          
          // Assign a hall (use TheatreAuditoriumID if available, otherwise random)
          const hall = allHalls.length > 0 ? allHalls[Math.floor(Math.random() * allHalls.length)] : null;
          if (!hall) continue;
          
          const startTime = new Date(show.dttmShowStart);
          const endTime = new Date(show.dttmShowEnd || new Date(startTime.getTime() + film.duration * 60000 + 15 * 60000));
          
          // Skip past sessions
          if (startTime < new Date()) continue;
          
          const sessionData = {
            film: film._id,
            hall: hall._id,
            startTime,
            endTime,
            price: {
              standard: parseFloat(show.PriceInCents) / 100 || 9.50,
              student: (parseFloat(show.PriceInCents) / 100 * 0.8) || 7.50,
              child: (parseFloat(show.PriceInCents) / 100 * 0.6) || 5.50,
              vip: (parseFloat(show.PriceInCents) / 100 * 1.5) || 14.00
            },
            is3D: show.PresentationMethod?.includes('3D') || false,
            subtitles: show.SubtitleLanguage1?.Name || 'Estonian',
            availableSeats: hall.capacity,
            status: 'scheduled'
          };
          
          await Session.create(sessionData);
          sessionsCreated++;
        } catch (err) {
          // Silently skip individual show errors
        }
      }
    }
    
    // If no sessions from API, create sample sessions for the next 7 days
    if (sessionsCreated === 0 && filmMap.size > 0) {
      console.log('  ℹ️ No sessions from API, creating sample sessions...');
      const allFilms = Array.from(filmMap.values());
      const allHalls = Array.from(hallMap.values());
      
      for (let day = 0; day < 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        date.setHours(0, 0, 0, 0);
        
        for (const film of allFilms.slice(0, 10)) { // Limit to 10 films
          const showTimes = ['10:00', '14:30', '19:00', '21:30'];
          
          for (let i = 0; i < showTimes.length; i++) {
            const [hours, minutes] = showTimes[i].split(':');
            const startTime = new Date(date);
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Skip past times
            if (startTime < new Date()) continue;
            
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + film.duration + 15);
            
            const hall = allHalls[Math.floor(Math.random() * allHalls.length)];
            
            try {
              await Session.create({
                film: film._id,
                hall: hall._id,
                startTime,
                endTime,
                price: {
                  standard: 8.50 + (i * 1.00),
                  student: 6.50,
                  child: 5.00,
                  vip: 12.00
                },
                is3D: Math.random() > 0.7,
                subtitles: 'Estonian',
                availableSeats: hall.capacity,
                status: 'scheduled'
              });
              sessionsCreated++;
            } catch (err) {
              // Skip duplicate sessions
            }
          }
        }
      }
    }
    
    console.log(`✓ Created ${sessionsCreated} sessions`);
    
    // Summary
    const [cinemaCount, hallCount, filmCount, sessionCount] = await Promise.all([
      Cinema.countDocuments(),
      Hall.countDocuments(),
      Film.countDocuments(),
      Session.countDocuments()
    ]);
    
    console.log('═══════════════════════════════════════');
    console.log('✅ Database refresh completed!');
    console.log(`   Cinemas: ${cinemaCount}`);
    console.log(`   Halls: ${hallCount}`);
    console.log(`   Films: ${filmCount}`);
    console.log(`   Sessions: ${sessionCount}`);
    console.log('═══════════════════════════════════════');
    
    return true;
  } catch (error) {
    console.error('❌ Database refresh failed:', error.message);
    throw error;
  }
}

// Helper function to format date in YYYY-MM-DD format (local timezone)
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Initialize server: connect to DB, refresh data, then start listening
 */
async function initializeServer() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    const dbName = MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'MongoDB';
    console.log(`✓ ${dbName} connected successfully`);
    
    // Refresh database from Apollo API
    await refreshDatabaseFromApollo();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server initialization failed:', err.message);
    process.exit(1);
  }
}

// Start the server
initializeServer();

// Helper function to validate and parse date string
function validateDate(dateStr) {
  if (!dateStr) return null;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  const date = new Date(dateStr + 'T00:00:00'); // Parse as local time
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return dateStr;
}

// Helper function to get default date range
function getDefaultDateRange(dtFrom, dtTo) {
  let fromDate = dtFrom;
  let toDate = dtTo;
  
  // Default to today if not provided
  if (!fromDate) {
    fromDate = formatDateLocal(new Date());
  } else {
    fromDate = validateDate(fromDate);
  }
  
  // Default to 14 days from dtFrom if not provided
  if (!toDate) {
    const fromDateObj = new Date(fromDate + 'T00:00:00');
    fromDateObj.setDate(fromDateObj.getDate() + 14);
    toDate = formatDateLocal(fromDateObj);
  } else {
    toDate = validateDate(toDate);
  }
  
  // Validate that dtTo is not before dtFrom
  const fromDateObj = new Date(fromDate + 'T00:00:00');
  const toDateObj = new Date(toDate + 'T00:00:00');
  if (toDateObj < fromDateObj) {
    throw new Error('End date (dtTo) cannot be before start date (dtFrom)');
  }
  
  return { dtFrom: fromDate, dtTo: toDate };
}

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
          select: 'name address apolloId'
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
 * GET /api/sessions/:id/seats
 * Get seat layout and occupied seats for a specific session
 */
app.get('/api/sessions/:id/seats', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const session = await Session.findById(id)
      .populate({
        path: 'hall',
        select: 'name rows seatsPerRow capacity cinema',
        populate: {
          path: 'cinema',
          select: 'name'
        }
      })
      .populate('film', 'title duration');

    if (!session || !session.hall) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const existingBookings = await Booking.find({
      session: id,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('seats');

    const occupiedSeats = [];
    for (const booking of existingBookings) {
      for (const seat of booking.seats) {
        occupiedSeats.push({ row: seat.row, number: seat.number });
      }
    }

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          film: session.film ? session.film.title : null,
          startTime: session.startTime,
          hall: session.hall.name,
          cinema: session.hall.cinema ? session.hall.cinema.name : null
        },
        layout: {
          rows: session.hall.rows,
          seatsPerRow: session.hall.seatsPerRow,
          capacity: session.hall.capacity,
          available: Math.max(session.hall.capacity - occupiedSeats.length, 0)
        },
        occupied: occupiedSeats
      }
    });
  } catch (error) {
    console.error('Error fetching session seats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch seat layout'
    });
  }
});

/**
 * GET /api/cinemas
 * List all cinemas
 */
app.get('/api/cinemas', async (req, res) => {
  try {
    const theatreAreas = await apolloKinoService.fetchTheatreAreas();
    if (theatreAreas.length > 0) {
      const apolloIds = theatreAreas
        .map(area => normalizeApolloId(area.ID))
        .filter(Boolean);
      const cinemas = apolloIds.length > 0
        ? await Cinema.find({ apolloId: { $in: apolloIds } })
        : [];
      const cinemaMap = new Map(cinemas.map(cinema => [cinema.apolloId, cinema]));
      const cinemaData = theatreAreas.map(area => {
        const apolloId = normalizeApolloId(area.ID);
        const dbCinema = apolloId ? cinemaMap.get(apolloId) : null;
        return {
          ...area,
          id: apolloId,
          _id: dbCinema?._id ?? null,
          name: dbCinema?.name ?? area.Name ?? area.name,
          address: dbCinema?.address ?? {
            street: area.Address,
            city: area.City,
            postalCode: area.PostalCode,
            country: area.Country ?? DEFAULT_COUNTRY
          },
          apolloId: apolloId ?? dbCinema?.apolloId ?? null
        };
      });
      return res.json({
        success: true,
        count: cinemaData.length,
        data: cinemaData
      });
    }

    const cinemas = await Cinema.find().sort({ name: 1 });
    const cinemaData = cinemas.map(mapCinemaToTheatreArea);

    res.json({
      success: true,
      count: cinemaData.length,
      data: cinemaData
    });
  } catch (error) {
    console.error('Apollo API failed, attempting database fallback for cinemas:', error);
    try {
      const cinemas = await Cinema.find().sort({ name: 1 });
      const cinemaData = cinemas.map(mapCinemaToTheatreArea);
      res.json({
        success: true,
        count: cinemaData.length,
        data: cinemaData
      });
    } catch (dbError) {
      console.error('Database fallback for cinemas also failed:', dbError);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cinemas'
      });
    }
  }
});

/**
 * GET /api/cinemas/:id/halls
 * Get all halls for a specific cinema
 */
app.get('/api/cinemas/:id/halls', async (req, res) => {
  try {
    const { id } = req.params;

    const cinemaQuery = [{ apolloId: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      cinemaQuery.unshift({ _id: id });
    }
    const cinema = await Cinema.findOne({ $or: cinemaQuery });
    const cinemaId = cinema?._id;

    if (!cinema) {
      return res.status(404).json({
        success: false,
        error: 'Cinema not found'
      });
    }

    // Get all halls for this cinema
    const halls = await Hall.find({ cinema: cinemaId }).sort({ name: 1 });

    res.json({
      success: true,
      cinema: {
        id: cinema._id,
        name: cinema.name,
        apolloId: cinema.apolloId
      },
      count: halls.length,
      data: halls
    });
  } catch (error) {
    console.error('Error fetching cinema halls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cinema halls'
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
 * Query parameters:
 *   - dtFrom: Start date (YYYY-MM-DD) - defaults to today
 *   - dtTo: End date (YYYY-MM-DD) - defaults to 14 days from dtFrom
 */
app.get('/api/apollo-kino/sync', async (req, res) => {
  try {
    // Get and validate date parameters
    const { dtFrom, dtTo } = getDefaultDateRange(req.query.dtFrom, req.query.dtTo);
    
    const data = await apolloKinoService.fetchSchedule(dtFrom, dtTo);
    
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
 *   - dtFrom: Start date (YYYY-MM-DD) - defaults to today
 *   - dtTo: End date (YYYY-MM-DD) - defaults to 14 days from dtFrom
 */
app.get('/api/apollo-kino/schedule', async (req, res) => {
  try {
    // Get and validate date parameters
    const { dtFrom, dtTo } = getDefaultDateRange(req.query.dtFrom, req.query.dtTo);
    
    const data = await apolloKinoService.fetchSchedule(dtFrom, dtTo);
    
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

/**
 * GET /api/apollo-kino/NewsCategories
 * Get news categories from Apollo Kino API
 * Returns list of available news categories
 */
app.get('/api/apollo-kino/NewsCategories', async (req, res) => {
  try {
    const newsCategories = await apolloKinoService.fetchNewsCategories();
    
    res.json({
      success: true,
      count: newsCategories.length,
      data: newsCategories
    });
  } catch (error) {
    console.error('Error fetching Apollo Kino News Categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news categories',
      message: error.message
    });
  }
});

/**
 * GET /api/apollo-kino/News
 * Get news articles from Apollo Kino API
 * Returns list of news articles
 */
app.get('/api/apollo-kino/News', async (req, res) => {
  try {
    const news = await apolloKinoService.fetchNews();
    
    res.json({
      success: true,
      count: news.length,
      data: news
    });
  } catch (error) {
    console.error('Error fetching Apollo Kino News:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings
 * Create a booking with seat selection
 */
app.post('/api/bookings', async (req, res) => {
  try {
    const { sessionId, seats, contactEmail, contactPhone, paymentMethod, userId } = req.body;

    if (!sessionId || !Array.isArray(seats) || seats.length === 0 || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, seats[], and contactEmail are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const session = await Session.findById(sessionId).populate('hall');
    if (!session || !session.hall) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const normalizedSeats = seats.map(seat => ({
      row: Number(seat.row),
      number: Number(seat.number)
    }));

    const invalidSeat = normalizedSeats.find(
      seat =>
        seat.row < 1 ||
        seat.number < 1 ||
        seat.row > session.hall.rows ||
        seat.number > session.hall.seatsPerRow
    );

    if (invalidSeat) {
      return res.status(400).json({
        success: false,
        error: 'One or more seats are outside hall layout'
      });
    }

    const uniqueSeatKeys = new Set();
    for (const seat of normalizedSeats) {
      const key = `${seat.row}-${seat.number}`;
      if (uniqueSeatKeys.has(key)) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate seats in request'
        });
      }
      uniqueSeatKeys.add(key);
    }

    const existingBookings = await Booking.find({
      session: sessionId,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('seats');

    const occupiedSeatKeys = new Set();
    for (const booking of existingBookings) {
      for (const seat of booking.seats) {
        occupiedSeatKeys.add(`${seat.row}-${seat.number}`);
      }
    }

    const conflictingSeat = normalizedSeats.find(seat =>
      occupiedSeatKeys.has(`${seat.row}-${seat.number}`)
    );

    if (conflictingSeat) {
      return res.status(409).json({
        success: false,
        error: `Seat ${conflictingSeat.row}-${conflictingSeat.number} is already booked`
      });
    }

    const seatIds = [];
    for (const seat of normalizedSeats) {
      const seatDoc = await Seat.findOneAndUpdate(
        { hall: session.hall._id, row: seat.row, number: seat.number },
        { hall: session.hall._id, row: seat.row, number: seat.number },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      seatIds.push(seatDoc._id);
    }

    let bookingNumber;
    do {
      bookingNumber = `BK-${crypto.randomBytes(BOOKING_ID_BYTES).toString('hex')}`;
    } while (await Booking.exists({ bookingNumber }));
    const ticketPrice = session.price && session.price.standard ? session.price.standard : 0;
    const totalPrice = ticketPrice * seatIds.length;

    const booking = await Booking.create({
      user: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : undefined,
      session: sessionId,
      seats: seatIds,
      totalPrice,
      bookingNumber,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      contactEmail,
      contactPhone
    });

    res.status(201).json({
      success: true,
      data: {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        totalPrice: booking.totalPrice,
        seats: normalizedSeats,
        session: sessionId,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

/**
 * GET /api/bookings/:bookingNumber
 * Retrieve a booking by booking number
 */
app.get('/api/bookings/:bookingNumber', async (req, res) => {
  try {
    const { bookingNumber } = req.params;
    const booking = await Booking.findOne({ bookingNumber })
      .populate('session', 'startTime')
      .populate({
        path: 'seats',
        select: 'row number'
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
});

// Admin API Endpoints

/**
 * GET /api/admin/sessions
 * Get all sessions (including past ones) for admin management
 */
app.get('/api/admin/sessions', async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('film', 'title originalTitle duration genre ageRating posterUrl rating')
      .populate({
        path: 'hall',
        select: 'name cinema screenType soundSystem capacity rows seatsPerRow',
        populate: {
          path: 'cinema',
          select: 'name address apolloId'
        }
      })
      .sort({ startTime: -1 });

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
 * GET /api/admin/sessions/:id
 * Get a specific session by ID for editing
 */
app.get('/api/admin/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const session = await Session.findById(id)
      .populate('film')
      .populate('hall');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session'
    });
  }
});

/**
 * POST /api/admin/sessions
 * Create a new session
 */
app.post('/api/admin/sessions', async (req, res) => {
  try {
    const { film, hall, startTime, endTime, price, is3D, subtitles, status } = req.body;

    // Validate required fields
    if (!film || !hall || !startTime || !endTime || !price || !price.standard) {
      return res.status(400).json({
        success: false,
        error: 'film, hall, startTime, endTime, and price.standard are required'
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(film)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid film ID'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(hall)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hall ID'
      });
    }

    // Check if film exists
    const filmDoc = await Film.findById(film);
    if (!filmDoc) {
      return res.status(404).json({
        success: false,
        error: 'Film not found'
      });
    }

    // Check if hall exists
    const hallDoc = await Hall.findById(hall);
    if (!hallDoc) {
      return res.status(404).json({
        success: false,
        error: 'Hall not found'
      });
    }

    // Validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    // Create session
    const session = await Session.create({
      film,
      hall,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      price,
      is3D: is3D || false,
      subtitles: subtitles || '',
      availableSeats: hallDoc.capacity,
      status: status || 'scheduled'
    });

    const populatedSession = await Session.findById(session._id)
      .populate('film', 'title originalTitle duration')
      .populate('hall', 'name cinema');

    res.status(201).json({
      success: true,
      data: populatedSession
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

/**
 * PUT /api/admin/sessions/:id
 * Update an existing session
 */
app.put('/api/admin/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { film, hall, startTime, endTime, price, is3D, subtitles, status, availableSeats } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Validate film if provided
    if (film && !mongoose.Types.ObjectId.isValid(film)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid film ID'
      });
    }

    // Validate hall if provided
    if (hall && !mongoose.Types.ObjectId.isValid(hall)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hall ID'
      });
    }

    // Build update object
    const updateData = {};
    if (film !== undefined) {
      const filmDoc = await Film.findById(film);
      if (!filmDoc) {
        return res.status(404).json({
          success: false,
          error: 'Film not found'
        });
      }
      updateData.film = film;
    }
    if (hall !== undefined) {
      const hallDoc = await Hall.findById(hall);
      if (!hallDoc) {
        return res.status(404).json({
          success: false,
          error: 'Hall not found'
        });
      }
      updateData.hall = hall;
      // Update available seats if hall changes
      if (availableSeats === undefined) {
        updateData.availableSeats = hallDoc.capacity;
      }
    }
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    
    // Validate time range if both times are being updated
    if (updateData.startTime || updateData.endTime) {
      const start = updateData.startTime || session.startTime;
      const end = updateData.endTime || session.endTime;
      if (end <= start) {
        return res.status(400).json({
          success: false,
          error: 'End time must be after start time'
        });
      }
    }
    
    if (price !== undefined) updateData.price = price;
    if (is3D !== undefined) updateData.is3D = is3D;
    if (subtitles !== undefined) updateData.subtitles = subtitles;
    if (status !== undefined) updateData.status = status;
    if (availableSeats !== undefined) updateData.availableSeats = availableSeats;

    const updatedSession = await Session.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('film', 'title originalTitle duration')
      .populate('hall', 'name cinema');

    res.json({
      success: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session'
    });
  }
});

/**
 * DELETE /api/admin/sessions/:id
 * Delete a session
 */
app.delete('/api/admin/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Check if there are any bookings for this session
    const bookingCount = await Booking.countDocuments({
      session: id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete session with ${bookingCount} active booking(s). Cancel bookings first.`
      });
    }

    await Session.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete session'
    });
  }
});

/**
 * GET /api/admin/halls
 * Get all halls for admin use
 */
app.get('/api/admin/halls', async (req, res) => {
  try {
    const halls = await Hall.find()
      .populate('cinema', 'name address apolloId')
      .sort({ 'cinema.name': 1, name: 1 });

    res.json({
      success: true,
      count: halls.length,
      data: halls
    });
  } catch (error) {
    console.error('Error fetching halls:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch halls'
    });
  }
});

/**
 * GET /api/admin/bookings
 * Get all bookings for admin management
 */
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: 'session',
        select: 'startTime film hall',
        populate: [
          { path: 'film', select: 'title' },
          { path: 'hall', select: 'name cinema', populate: { path: 'cinema', select: 'name' } }
        ]
      })
      .populate('seats', 'row number')
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

/**
 * DELETE /api/admin/bookings/:id
 * Delete a booking
 */
app.delete('/api/admin/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Update session available seats when booking is deleted
    const session = await Session.findById(booking.session);
    if (session) {
      await Session.findByIdAndUpdate(booking.session, {
        $inc: { availableSeats: booking.seats.length }
      });
    }

    await Booking.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking'
    });
  }
});
