require("node:dns").setServers(["1.1.1.1", "8.8.8.8"]);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { Film, Session, Cinema, Hall, Booking, Seat } = require('./Models');
const ApolloKinoService = require('./services/apolloKinoService');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;
const BOOKING_ID_BYTES = 6;
const DEFAULT_COUNTRY = 'Estonia';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60;
const PAYMENT_METHODS = ['card', 'cash', 'online'];
const DEFAULT_SCHEDULE_HALL_ROWS = 9;
const DEFAULT_SCHEDULE_HALL_SEATS_PER_ROW = 13;
const DEFAULT_SCHEDULE_HALL_CAPACITY = 150;
const DEFAULT_SCHEDULE_HALL_SCREEN_TYPE = 'Standard';
const DEFAULT_SCHEDULE_HALL_SOUND_SYSTEM = 'Digital 5.1';

const cinemaRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});

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

// Apollo payloads vary between EventID/EventId casing depending on source/version.
const extractShowEventId = show =>
  show?.EventID ?? show?.EventId ?? show?.Event?.ID ?? show?.Event?.EventID ?? null;

// Prefer explicit show titles (EventTitle/Title) and fall back to original titles when needed.
const extractShowTitle = show =>
  show?.EventTitle ?? show?.Title ?? show?.OriginalTitle ?? show?.Event?.Title ?? show?.Event?.OriginalTitle ?? null;

// Prefer the schedule synopsis but fall back to event-level description when needed.
const extractShowDescription = show =>
  show?.Synopsis ?? show?.EventDescription ?? null;

const normalizeHallName = value => {
  if (!value) return '';
  return String(value).trim().toLowerCase();
};

// Prioritize fields in the order Apollo schedule payloads commonly expose hall names.
const SCHEDULE_HALL_FIELDS = ['TheatreAuditorium', 'Auditorium', 'AuditoriumName', 'TheatreAuditoriumName'];

const extractShowHallName = show => {
  for (const field of SCHEDULE_HALL_FIELDS) {
    const hallValue = show?.[field];
    if (!hallValue) continue;
    if (typeof hallValue === 'object') {
      const name = hallValue.Name ?? hallValue.name;
      if (name) return name;
      continue;
    }
    return hallValue;
  }
  return null;
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

const extractScheduleEvents = eventsPayload => {
  if (!eventsPayload) return [];
  if (eventsPayload.Events?.Event) {
    return normalizeToArray(eventsPayload.Events.Event);
  }
  if (Array.isArray(eventsPayload.Events)) {
    return eventsPayload.Events;
  }
  if (Array.isArray(eventsPayload)) {
    return eventsPayload;
  }
  if (eventsPayload.Event) {
    return normalizeToArray(eventsPayload.Event);
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

    const cinemaMap = new Map();
    const hallMap = new Map();
    const hallsByCinemaId = new Map();
    const hallsByCinemaName = new Map();

    const registerHallName = (cinemaKey, hall) => {
      const hallKey = normalizeHallName(hall?.name);
      if (!hallKey) return;
      const hallNameMap = hallsByCinemaName.get(cinemaKey) ?? new Map();
      hallNameMap.set(hallKey, hall);
      hallsByCinemaName.set(cinemaKey, hallNameMap);
    };

    // ОПТИМИЗАЦИЯ: Собираем все в массивы для пакетной вставки
    const cinemasToCreate = [];
    const cinemaAreaMapping = []; // Для сохранения связи cinema -> area

    // Шаг 1: Подготовка данных кинотеатров
    for (const area of theatreAreas) {
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
      cinemasToCreate.push(cinemaData);
      cinemaAreaMapping.push(area);
    }

    // Шаг 2: Пакетное создание кинотеатров
    console.log(`💾 Creating ${cinemasToCreate.length} cinemas...`);
    const createdCinemas = await Cinema.insertMany(cinemasToCreate, { ordered: true });

    // Шаг 3: Создание карты кинотеатров и подготовка залов
    const hallsToCreate = [];
    const hallCinemaMapping = []; // Для связи hall -> cinema после создания

    for (let i = 0; i < createdCinemas.length; i++) {
      const cinema = createdCinemas[i];
      const area = cinemaAreaMapping[i];
      const cinemaKey = normalizeApolloId(area.ID) ?? 'default';

      // ВАЖНО: Заполняем cinemaMap
      cinemaMap.set(cinemaKey, cinema);
      if (area.ID !== null && area.ID !== undefined && String(area.ID) !== cinemaKey) {
        cinemaMap.set(area.ID, cinema);
      }

      // Подготовка залов для этого кинотеатра
      for (let hallNum = 1; hallNum <= 3; hallNum++) {
        const capacity = 100 + (hallNum * 50);
        const rows = 8 + hallNum;
        const seatsPerRow = 12 + hallNum;

        const hallData = {
          cinema: cinema._id,
          name: `Hall ${hallNum}`,
          capacity: capacity,
          rows: rows,
          seatsPerRow: seatsPerRow,
          screenType: hallNum === 1 ? 'IMAX' : (hallNum === 2 ? '3D' : 'Standard'),
          soundSystem: hallNum <= 2 ? 'Dolby Atmos' : 'Digital 5.1'
        };

        hallsToCreate.push(hallData);
        hallCinemaMapping.push({
          cinemaKey: cinemaKey,
          areaId: area.ID,
          hallNum: hallNum,
          hallData: hallData
        });
      }
    }

    // Шаг 4: Пакетное создание залов
    console.log(`💾 Creating ${hallsToCreate.length} halls...`);
    const createdHalls = await Hall.insertMany(hallsToCreate, { ordered: true });

    // Шаг 5: ВАЖНО! Заполняем hallMap, hallsByCinemaId и вызываем registerHallName
    console.log(`🗺️ Building hall lookup maps...`);
    const seatsToCreate = [];

    for (let i = 0; i < createdHalls.length; i++) {
      const hall = createdHalls[i];
      const mapping = hallCinemaMapping[i];

      // ВАЖНО: Заполняем hallMap (используется для поиска залов при создании сессий)
      hallMap.set(`${mapping.areaId}-${mapping.hallNum}`, hall);

      // ВАЖНО: Заполняем hallsByCinemaId (массив залов для каждого кинотеатра)
      const hallsForCinema = hallsByCinemaId.get(mapping.cinemaKey) ?? [];
      hallsForCinema.push(hall);
      hallsByCinemaId.set(mapping.cinemaKey, hallsForCinema);

      // ВАЖНО: Вызываем registerHallName (создает hallsByCinemaName для поиска по имени)
      registerHallName(mapping.cinemaKey, hall);

      // Подготовка мест для этого зала
      const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let row = 0; row < hall.rows; row++) {
        const rowLabel = rowLetters[row % rowLetters.length];
        for (let seatNum = 1; seatNum <= hall.seatsPerRow; seatNum++) {
          seatsToCreate.push({
            hall: hall._id,
            row: rowLabel,
            number: seatNum,
            type: (row <= 1 || seatNum <= 2 || seatNum >= hall.seatsPerRow - 1) ? 'vip' : 'standard',
            isAvailable: true
          });
        }
      }
    }

    // Шаг 6: Пакетное создание мест (разбиваем на чанки по 5000)
    console.log(`💾 Creating ${seatsToCreate.length} seats in batches...`);
    const CHUNK_SIZE = 5000;
    let seatsCreated = 0;

    for (let i = 0; i < seatsToCreate.length; i += CHUNK_SIZE) {
      const chunk = seatsToCreate.slice(i, i + CHUNK_SIZE);
      await Seat.insertMany(chunk, { ordered: false });
      seatsCreated += chunk.length;
    }

    console.log(`✅ Database setup complete: ${createdCinemas.length} cinemas, ${createdHalls.length} halls, ${seatsCreated} seats`);

    // Step 3: Fetch Events and create Films
    console.log('🎬 Fetching Events (Films)...');
    const events = await apolloKinoService.fetchEvents();
    console.log(`✓ Found ${events.length} events`);

    const filmMap = new Map(); // Map Apollo event ID to MongoDB film
    const createFilmRecord = async (filmData, apolloId) => {
      const film = await Film.create(filmData);
      if (apolloId) {
        filmMap.set(apolloId, film);
      }
      return film;
    };

    const filmsToCreate = [];
    const filmEventMapping = [];

    for (const event of events) {
      try {
        const filmData = apolloKinoService.transformEventToFilm(event);
        const apolloId = normalizeApolloId(event.ID);
        filmsToCreate.push(filmData);
        filmEventMapping.push({ apolloId, event });
      } catch (err) {
        console.error(`  ⚠️ Error transforming film for event ${event.ID}:`, err.message);
      }
    }

    // Пакетное создание фильмов
    if (filmsToCreate.length > 0) {
      const createdFilms = await Film.insertMany(filmsToCreate, { ordered: false });

      // Заполняем filmMap
      for (let i = 0; i < createdFilms.length; i++) {
        const film = createdFilms[i];
        const mapping = filmEventMapping[i];
        if (mapping.apolloId) {
          filmMap.set(mapping.apolloId, film);
        }
      }

      console.log(`✓ Created ${createdFilms.length} films`);
    } else {
      console.log(`⚠️ No films to create`);
    }

    // Step 4: Fetch Schedule and create Sessions
    console.log('📅 Fetching Schedule...');
    // Fetch without date parameters to get ALL available sessions from Apollo API
    // This retrieves all 1000+ sessions instead of just today's sessions
    const scheduleData = await apolloKinoService.fetchSchedule();

    let sessionsCreated = 0;

    // Process schedule shows if available
    const shows = scheduleData.shows || extractShowsFromSchedule(scheduleData.schedule);
    const scheduleEvents = scheduleData.movies || extractScheduleEvents(scheduleData.events);
    // Schedule events come from the same Apollo feed as films, so normalized IDs are sufficient.
    const scheduleEventMap = new Map(
      scheduleEvents
        .map(event => [normalizeApolloId(event.ID), event])
        .filter(([id]) => id)
    );

    if (shows.length > 0) {
      console.log(`✓ Found ${shows.length} shows in schedule`);

      // Get all halls as array for random assignment
      const allHalls = Array.from(hallMap.values());

      // ОПТИМИЗАЦИЯ: Собираем все сессии в массив для пакетной вставки
      const sessionsToCreate = [];
      let skippedShows = 0;
      let processedShows = 0;

      for (const show of shows) {
        processedShows++;

        try {
          // Find or create the film by event ID
          const eventId = extractShowEventId(show);
          const apolloId = normalizeApolloId(eventId);
          let film = apolloId ? filmMap.get(apolloId) : null;
          const showTitle = extractShowTitle(show);

          if (!film && apolloId && scheduleEventMap.has(apolloId)) {
            const scheduleEvent = scheduleEventMap.get(apolloId);
            try {
              const filmData = apolloKinoService.transformEventToFilm(scheduleEvent);
              film = await createFilmRecord(filmData, apolloId);
            } catch (filmErr) {
              skippedShows++;
              continue;
            }
          }

          // If film not found in events, create it from show data
          if (!film && showTitle) {
            try {
              const ageRatingMap = {
                'MS-1': 'MS-1',
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

              // ИСПРАВЛЕНИЕ: Правильный парсинг языка
              const parseLanguage = (langValue) => {
                if (!langValue) return 'Unknown';
                if (typeof langValue === 'object') {
                  return langValue.Name || langValue.NameInLanguage || 'Unknown';
                }
                return String(langValue);
              };

              // ИСПРАВЛЕНИЕ: Правильный парсинг субтитров
              const parseSubtitles = (subValue) => {
                if (!subValue) return [];
                if (typeof subValue === 'object') {
                  const name = subValue.Name || subValue.NameInLanguage;
                  return name ? [name] : [];
                }
                return [String(subValue)];
              };

              const filmData = {
                title: showTitle,
                originalTitle: show.OriginalTitle || showTitle,
                description: extractShowDescription(show) || 'No description available',
                duration: parseInt(show.LengthInMinutes) || 90,
                genre: genres,
                director: show.Director || 'Unknown',
                cast: [],
                releaseDate: show.dtLocalRelease ? new Date(show.dtLocalRelease) : new Date(),
                language: parseLanguage(show.SpokenLanguage), // ИСПРАВЛЕНО
                subtitles: parseSubtitles(show.SubtitleLanguage1), // ИСПРАВЛЕНО
                ageRating: ageRatingMap[show.RatingLabel || show.Rating] || 'G',
                posterUrl: show.Images?.EventMediumImagePortrait || '',
                trailerUrl: '',
                rating: 0,
                isActive: true
              };

              film = await createFilmRecord(filmData, apolloId);
            } catch (filmCreateErr) {
              skippedShows++;
              continue;
            }
          }

          if (!film) {
            skippedShows++;
            continue;
          }

          // Find or create hall
          const theatreId = normalizeApolloId(show.TheatreID);
          const hallName = extractShowHallName(show);
          let hall = null;

          if (theatreId) {
            const normalizedHallName = normalizeHallName(hallName);
            const hallNameMap = hallsByCinemaName.get(theatreId);
            if (hallNameMap && normalizedHallName) {
              hall = hallNameMap.get(normalizedHallName);
            }
            if (!hall) {
              const hallsForCinema = hallsByCinemaId.get(theatreId);
              if (hallsForCinema && hallsForCinema.length > 0) {
                hall = hallsForCinema[0];
              }
            }
          }

          if (!hall && allHalls.length > 0) {
            hall = allHalls[Math.floor(Math.random() * allHalls.length)];
          }

          if (!hall) {
            skippedShows++;
            continue;
          }

          // Parse dates
          const startFieldPriority = show.dttmShowStartLocal
            ? ['dttmShowStartLocal', 'dttmShowStart', 'dttmShowStartUTC']
            : ['dttmShowStart', 'dttmShowStartLocal', 'dttmShowStartUTC'];
          const startValue = startFieldPriority
            .map(field => show[field])
            .find(value => value);
          const startTime = startValue ? new Date(startValue) : null;

          if (!startTime || Number.isNaN(startTime.getTime())) {
            skippedShows++;
            continue;
          }

          const endFieldPriority = show.dttmShowEndLocal
            ? ['dttmShowEndLocal', 'dttmShowEnd', 'dttmShowEndUTC']
            : ['dttmShowEnd', 'dttmShowEndLocal', 'dttmShowEndUTC'];
          const endValue = endFieldPriority
            .map(field => show[field])
            .find(value => value);
          let endTime = endValue ? new Date(endValue) : null;
          if (!endTime || Number.isNaN(endTime.getTime())) {
            endTime = new Date(startTime.getTime() + film.duration * 60000 + 15 * 60000);
          }

          // Skip past sessions
          if (startTime < new Date()) {
            skippedShows++;
            continue;
          }

          // Parse language from show - поддержка нескольких языков
          const parseShowLanguage = (show) => {
            const languages = [];

            // Основной язык
            if (show.SpokenLanguage) {
              if (typeof show.SpokenLanguage === 'object') {
                const name = show.SpokenLanguage.Name || show.SpokenLanguage.NameInLanguage;
                if (name) languages.push(name);
              } else {
                languages.push(String(show.SpokenLanguage));
              }
            }

            // Дополнительный язык если есть
            if (show.SpokenLanguage2) {
              if (typeof show.SpokenLanguage2 === 'object') {
                const name = show.SpokenLanguage2.Name || show.SpokenLanguage2.NameInLanguage;
                if (name) languages.push(name);
              } else {
                languages.push(String(show.SpokenLanguage2));
              }
            }

            return languages.length > 0 ? languages.join(', ') : 'Unknown';
          };

          // Parse subtitles from show - поддержка нескольких субтитров
          const parseShowSubtitles = (show) => {
            const subtitles = [];

            // Первый язык субтитров
            if (show.SubtitleLanguage1) {
              if (typeof show.SubtitleLanguage1 === 'object') {
                const name = show.SubtitleLanguage1.Name || show.SubtitleLanguage1.NameInLanguage;
                if (name) subtitles.push(name);
              } else {
                subtitles.push(String(show.SubtitleLanguage1));
              }
            }

            // Второй язык субтитров если есть
            if (show.SubtitleLanguage2) {
              if (typeof show.SubtitleLanguage2 === 'object') {
                const name = show.SubtitleLanguage2.Name || show.SubtitleLanguage2.NameInLanguage;
                if (name) subtitles.push(name);
              } else {
                subtitles.push(String(show.SubtitleLanguage2));
              }
            }

            return subtitles.join(', ');
          };

          const sessionLanguage = parseShowLanguage(show);
          const sessionSubtitles = parseShowSubtitles(show);

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
            language: sessionLanguage,  // БЕРЕМ ИЗ SHOW!
            subtitles: sessionSubtitles, // БЕРЕМ ИЗ SHOW!
            availableSeats: hall.capacity,
            status: 'scheduled'
          };

          sessionsToCreate.push(sessionData);
        } catch (err) {
          skippedShows++;
        }
      }

      // ПАКЕТНАЯ ВСТАВКА - в 100 раз быстрее!
      console.log(`💾 Inserting ${sessionsToCreate.length} sessions into database...`);

      if (sessionsToCreate.length > 0) {
        try {
          // insertMany с ordered: false продолжит даже если некоторые записи упадут
          const result = await Session.insertMany(sessionsToCreate, {
            ordered: false,
            rawResult: true
          });
          sessionsCreated = result.insertedCount || sessionsToCreate.length;
        } catch (err) {
          // Если есть дубликаты или другие ошибки, попробуем узнать сколько вставилось
          if (err.writeErrors) {
            sessionsCreated = sessionsToCreate.length - err.writeErrors.length;
            console.log(`⚠️ Inserted ${sessionsCreated} sessions (${err.writeErrors.length} duplicates skipped)`);
          } else {
            console.error('❌ Error during bulk insert:', err.message);
          }
        }
      }

      console.log(`📊 Summary: ${processedShows} shows processed, ${sessionsCreated} sessions created, ${skippedShows} skipped`);
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

    // Always refresh database from Apollo Kino on startup
    // This ensures we have the latest data and removes old/stale data
    console.log('🔄 Refreshing database from Apollo Kino API...');
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

function normalizeApolloScheduleDate(dateStr) {
  if (!dateStr) return null;
  const apolloRegex = /^\d{2}\.\d{2}\.\d{4}$/;
  if (apolloRegex.test(dateStr)) {
    return dateStr;
  }
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }
  throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD or DD.MM.YYYY.`);
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

function parseSeatRowConfig(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return [...new Set(value.map(row => Number(row)).filter(row => Number.isInteger(row) && row > 0))];
  }
  if (typeof value === 'string') {
    return [...new Set(value
      .split(',')
      .map(part => Number(part.trim()))
      .filter(row => Number.isInteger(row) && row > 0))];
  }
  return [];
}

async function recreateHallSeats(hall, { vipRows = [], twinRows = [] } = {}) {
  const normalizedVipRows = new Set(parseSeatRowConfig(vipRows));
  const normalizedTwinRows = new Set(parseSeatRowConfig(twinRows));

  const seats = [];
  for (let row = 1; row <= hall.rows; row++) {
    for (let number = 1; number <= hall.seatsPerRow; number++) {
      let seatType = 'standard';
      if (normalizedVipRows.has(row)) {
        seatType = 'vip';
      } else if (normalizedTwinRows.has(row) && number % 2 === 0) {
        seatType = 'twin';
      }
      seats.push({ hall: hall._id, row, number, seatType, isActive: true });
    }
  }

  await Seat.deleteMany({ hall: hall._id });
  if (seats.length > 0) {
    await Seat.insertMany(seats, { ordered: false });
  }

  return {
    total: seats.length,
    vip: seats.filter(seat => seat.seatType === 'vip').length,
    twin: seats.filter(seat => seat.seatType === 'twin').length,
    standard: seats.filter(seat => seat.seatType === 'standard').length
  };
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
      .sort({ startTime: 1 })
      .lean();

    let sessionsToReturn = sessions;
    if (sessions.length > 0) {
      const sessionIds = sessions.map(session => session._id);
      const bookedSeatCounts = await Booking.aggregate([
        {
          $match: {
            session: { $in: sessionIds },
            status: { $in: ['pending', 'confirmed'] }
          }
        },
        {
          $project: {
            session: 1,
            seatsCount: { $size: { $ifNull: ['$seats', []] } }
          }
        },
        {
          $group: {
            _id: '$session',
            bookedSeats: { $sum: '$seatsCount' }
          }
        }
      ]);
      const seatCountBySession = bookedSeatCounts.reduce((seatCountMap, item) => {
        seatCountMap[String(item._id)] = item.bookedSeats;
        return seatCountMap;
      }, {});

      sessionsToReturn = sessions.map(session => {
        const totalCapacity = session.hall?.capacity ?? 0;
        const bookedSeats = seatCountBySession[String(session._id)] ?? 0;
        return {
          ...session,
          availableSeats: Math.max(totalCapacity - bookedSeats, 0)
        };
      });
    }

    res.json({
      success: true,
      count: sessionsToReturn.length,
      data: sessionsToReturn
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

    // Fetch seat types for this hall
    const hallSeats = await Seat.find({ hall: session.hall._id, isActive: true });
    const seatTypes = {};
    for (const seat of hallSeats) {
      const key = `${seat.row}-${seat.number}`;
      seatTypes[key] = seat.seatType;
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
        occupied: occupiedSeats,
        seatTypes: seatTypes
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
app.get('/api/cinemas', cinemaRateLimiter, async (req, res) => {
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
app.get('/api/cinemas/:id/halls', cinemaRateLimiter, async (req, res) => {
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
    // Fetch all schedule data from Apollo API (date filtering is now done at application level)
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
 * GET /api/apollo-kino/sync-cinemas
 * Sync cinema and hall entities from Apollo Kino TheatreAreas endpoint
 */
app.get('/api/apollo-kino/sync-cinemas', async (req, res) => {
  try {
    const theatreAreas = await apolloKinoService.fetchTheatreAreas();
    const syncResults = {
      cinemas: { added: 0, updated: 0 },
      halls: { added: 0, updated: 0 },
      seats: { regenerated: 0 }
    };

    for (const area of theatreAreas) {
      const apolloId = normalizeApolloId(area.ID);
      const cinemaData = {
        apolloId,
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

      let cinema = null;
      if (apolloId) {
        cinema = await Cinema.findOne({ apolloId });
      }

      if (cinema) {
        await Cinema.findByIdAndUpdate(cinema._id, cinemaData, { runValidators: true });
        cinema = await Cinema.findById(cinema._id);
        syncResults.cinemas.updated += 1;
      } else {
        cinema = await Cinema.create(cinemaData);
        syncResults.cinemas.added += 1;
      }

      for (let i = 1; i <= 3; i++) {
        const hallName = `Hall ${i}`;
        const hallPayload = {
          cinema: cinema._id,
          name: hallName,
          capacity: 100 + (i * 50),
          rows: 8 + i,
          seatsPerRow: 12 + i,
          screenType: i === 1 ? 'IMAX' : (i === 2 ? '3D' : 'Standard'),
          soundSystem: i <= 2 ? 'Dolby Atmos' : 'Digital 5.1'
        };
        const existingHall = await Hall.findOne({ cinema: cinema._id, name: hallName });
        let hall = existingHall;

        if (existingHall) {
          hall = await Hall.findByIdAndUpdate(existingHall._id, hallPayload, { new: true, runValidators: true });
          syncResults.halls.updated += 1;
        } else {
          hall = await Hall.create(hallPayload);
          syncResults.halls.added += 1;
        }

        await recreateHallSeats(hall);
        syncResults.seats.regenerated += 1;
      }
    }

    res.json({
      success: true,
      message: 'Cinemas and halls synced successfully',
      results: syncResults,
      count: theatreAreas.length
    });
  } catch (error) {
    console.error('Error syncing Apollo Kino cinemas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync Apollo Kino cinemas',
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
    // Fetch all schedule data from Apollo API (date filtering is now done at application level)
    const data = await apolloKinoService.fetchSchedule();

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
    const { sessionId, seats, contactEmail, contactPhone, paymentMethod, paymentStatus, userId } = req.body;

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

    const normalizedPaymentMethod = PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : undefined;
    const normalizedPaymentStatus = normalizedPaymentMethod && paymentStatus === 'paid' ? 'paid' : 'pending';
    const normalizedBookingStatus = normalizedPaymentStatus === 'paid' ? 'confirmed' : 'pending';

    const booking = await Booking.create({
      user: userId && mongoose.Types.ObjectId.isValid(userId) ? userId : undefined,
      session: sessionId,
      seats: seatIds,
      totalPrice,
      bookingNumber,
      status: normalizedBookingStatus,
      paymentStatus: normalizedPaymentStatus,
      paymentMethod: normalizedPaymentMethod,
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
      .populate({
        path: 'session',
        select: 'startTime endTime',
        populate: [
          {
            path: 'film',
            select: 'title originalTitle duration genre ageRating posterUrl rating language subtitles'
          },
          {
            path: 'hall',
            select: 'name cinema screenType soundSystem',
            populate: {
              path: 'cinema',
              select: 'name address apolloId'
            }
          }
        ]
      })
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
 * GET /api/admin/movies
 * Get all films (active and inactive) for admin management
 */
app.get('/api/admin/movies', async (req, res) => {
  try {
    const films = await Film.find().sort({ createdAt: -1 });
    res.json({ success: true, count: films.length, data: films });
  } catch (error) {
    console.error('Error fetching admin movies:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch movies' });
  }
});

/**
 * POST /api/admin/movies
 * Create a new movie
 */
app.post('/api/admin/movies', async (req, res) => {
  try {
    const movie = await Film.create(req.body);
    res.status(201).json({ success: true, data: movie });
  } catch (error) {
    console.error('Error creating movie:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to create movie' });
  }
});

/**
 * PUT /api/admin/movies/:id
 * Update an existing movie
 */
app.put('/api/admin/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid movie ID' });
    }

    const updated = await Film.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating movie:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to update movie' });
  }
});

/**
 * DELETE /api/admin/movies/:id
 * Delete movie if no sessions exist
 */
app.delete('/api/admin/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid movie ID' });
    }

    const movie = await Film.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, error: 'Movie not found' });
    }

    const sessionCount = await Session.countDocuments({ film: id });
    if (sessionCount > 0) {
      return res.status(400).json({ success: false, error: `Cannot delete movie with ${sessionCount} session(s).` });
    }

    await Film.findByIdAndDelete(id);
    res.json({ success: true, message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('Error deleting movie:', error);
    res.status(500).json({ success: false, error: 'Failed to delete movie' });
  }
});


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
 * POST /api/admin/halls
 * Create a new hall
 */
app.post('/api/admin/halls', async (req, res) => {
  try {
    const { cinema, name, rows, seatsPerRow, capacity, screenType, soundSystem } = req.body;

    if (!cinema || !name || !rows || !seatsPerRow || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: cinema, name, rows, seatsPerRow, capacity'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(cinema)) {
      return res.status(400).json({ success: false, error: 'Invalid cinema ID' });
    }

    const cinemaExists = await Cinema.findById(cinema);
    if (!cinemaExists) {
      return res.status(404).json({ success: false, error: 'Cinema not found' });
    }

    const hallData = {
      cinema,
      name,
      rows,
      seatsPerRow,
      capacity,
      screenType: screenType || 'Standard',
      soundSystem: soundSystem || 'Digital 5.1'
    };

    const hall = await Hall.create(hallData);

    // Generate default seats for the hall
    await recreateHallSeats(hall);

    const populatedHall = await Hall.findById(hall._id).populate('cinema', 'name address');

    res.status(201).json({
      success: true,
      message: 'Hall created successfully',
      data: populatedHall
    });
  } catch (error) {
    console.error('Error creating hall:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create hall',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/halls/:id
 * Update a hall
 */
app.put('/api/admin/halls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cinema, name, rows, seatsPerRow, capacity, screenType, soundSystem } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid hall ID' });
    }

    const hall = await Hall.findById(id);
    if (!hall) {
      return res.status(404).json({ success: false, error: 'Hall not found' });
    }

    if (cinema && !mongoose.Types.ObjectId.isValid(cinema)) {
      return res.status(400).json({ success: false, error: 'Invalid cinema ID' });
    }

    if (cinema) {
      const cinemaExists = await Cinema.findById(cinema);
      if (!cinemaExists) {
        return res.status(404).json({ success: false, error: 'Cinema not found' });
      }
    }

    const updates = {};
    if (cinema) updates.cinema = cinema;
    if (name) updates.name = name;
    if (rows) updates.rows = rows;
    if (seatsPerRow) updates.seatsPerRow = seatsPerRow;
    if (capacity) updates.capacity = capacity;
    if (screenType) updates.screenType = screenType;
    if (soundSystem) updates.soundSystem = soundSystem;

    const updatedHall = await Hall.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('cinema', 'name address');

    // If rows or seatsPerRow changed, regenerate seats
    if (rows || seatsPerRow) {
      await recreateHallSeats(updatedHall);
    }

    res.json({
      success: true,
      message: 'Hall updated successfully',
      data: updatedHall
    });
  } catch (error) {
    console.error('Error updating hall:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update hall',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/halls/:id
 * Delete a hall
 */
app.delete('/api/admin/halls/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid hall ID' });
    }

    const hall = await Hall.findById(id);
    if (!hall) {
      return res.status(404).json({ success: false, error: 'Hall not found' });
    }

    // Check if there are any sessions using this hall
    const sessionsCount = await Session.countDocuments({ hall: id });
    if (sessionsCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete hall. It has ${sessionsCount} session(s) scheduled. Please delete or reassign those sessions first.`
      });
    }

    // Delete all seats associated with this hall
    await Seat.deleteMany({ hall: id });

    // Delete the hall
    await Hall.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Hall and associated seats deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hall:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete hall',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/bookings
 * Get all bookings for admin management
 */

/**
 * GET /api/admin/halls/:id/seats
 * Get seat map for a hall
 */
app.get('/api/admin/halls/:id/seats', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid hall ID' });
    }

    const hall = await Hall.findById(id).populate('cinema', 'name');
    if (!hall) {
      return res.status(404).json({ success: false, error: 'Hall not found' });
    }

    const seats = await Seat.find({ hall: id, isActive: true }).sort({ row: 1, number: 1 });
    res.json({
      success: true,
      data: {
        hall,
        seats,
        stats: {
          total: seats.length,
          vip: seats.filter(seat => seat.seatType === 'vip').length,
          twin: seats.filter(seat => seat.seatType === 'twin').length,
          standard: seats.filter(seat => seat.seatType === 'standard').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching hall seats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hall seats' });
  }
});

/**
 * POST /api/admin/halls/:id/seats/generate
 * Recreate seat layout with VIP/twin row configuration
 */
app.post('/api/admin/halls/:id/seats/generate', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid hall ID' });
    }

    const hall = await Hall.findById(id);
    if (!hall) {
      return res.status(404).json({ success: false, error: 'Hall not found' });
    }

    const stats = await recreateHallSeats(hall, {
      vipRows: req.body.vipRows,
      twinRows: req.body.twinRows
    });

    res.json({
      success: true,
      message: 'Seat layout regenerated successfully',
      data: {
        hallId: hall._id,
        rows: hall.rows,
        seatsPerRow: hall.seatsPerRow,
        ...stats
      }
    });
  } catch (error) {
    console.error('Error generating hall seats:', error);
    res.status(500).json({ success: false, error: 'Failed to generate hall seats' });
  }
});

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
