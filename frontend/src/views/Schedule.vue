<template>
  <div class="schedule">
    <!-- Hero Banner -->
    <section class="hero-banner">
      <div class="hero-overlay">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">🎞️ Movie Schedule</h1>
            <p class="hero-subtitle">Find Your Perfect Showtime</p>
            <p class="hero-description">Browse available sessions and book your tickets for the best cinema experience</p>
          </div>
        </div>
      </div>
    </section>

    <div class="container">
      <!-- Filters Section -->
      <div class="filters-container">
        <!-- Cinema Selection -->
        <div class="filter-section">
          <div class="custom-dropdown" :class="{ open: cinemaDropdownOpen }">
            <button class="dropdown-btn" @click="toggleCinemaDropdown">
              <span class="dropdown-icon">🎬</span>
              <span>Cinema</span>
              <span class="arrow">▼</span>
            </button>
            <div class="dropdown-menu" v-if="cinemaDropdownOpen">
              <div 
                class="dropdown-item" 
                :class="{ active: selectedCinema === '' }"
                @click="selectCinema('')"
              >
                All Cinemas
              </div>
              <div 
                v-for="cinema in cinemas" 
                :key="cinema.id" 
                class="dropdown-item"
                :class="{ active: selectedCinema === cinema.id }"
                @click="selectCinema(cinema.id)"
              >
                {{ cinema.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Genre, Format, and Date Selection in one group -->
        <div class="filter-group-extended">
          <!-- Genre Filter -->
          <div class="filter-section">
            <div class="custom-dropdown" :class="{ open: genreDropdownOpen }">
              <button class="dropdown-btn dropdown-btn-compact" @click="toggleGenreDropdown">
                <span class="dropdown-icon">🎭</span>
                <span>Genre</span>
                <span class="arrow">▼</span>
              </button>
              <div class="dropdown-menu" v-if="genreDropdownOpen">
                <div 
                  class="dropdown-item" 
                  :class="{ active: selectedGenre === '' }"
                  @click="selectGenre('')"
                >
                  All Genres
                </div>
                <div
                  v-for="genre in availableGenres"
                  :key="genre"
                  class="dropdown-item"
                  :class="{ active: selectedGenre === genre }"
                  @click="selectGenre(genre)"
                >
                  {{ formatGenreLabel(genre) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Format Filter -->
          <div class="filter-section">
            <div class="custom-dropdown" :class="{ open: formatDropdownOpen }">
              <button class="dropdown-btn dropdown-btn-compact" @click="toggleFormatDropdown">
                <span class="dropdown-icon">📽️</span>
                <span>Format</span>
                <span class="arrow">▼</span>
              </button>
              <div class="dropdown-menu" v-if="formatDropdownOpen">
                <div 
                  class="dropdown-item" 
                  :class="{ active: selectedFormat === '' }"
                  @click="selectFormat('')"
                >
                  All Formats
                </div>
                <div class="dropdown-item" :class="{ active: selectedFormat === '2D' }" @click="selectFormat('2D')">2D</div>
                <div class="dropdown-item" :class="{ active: selectedFormat === '3D' }" @click="selectFormat('3D')">3D</div>
              </div>
            </div>
          </div>

          <!-- Date Selection -->
          <div class="date-selection-inline">
            <button @click="previousWeek" class="date-nav-btn-inline" :disabled="currentWeekIndex === 0">
              <span>‹</span>
            </button>
            <div class="dates-container-inline">
              <button
                v-for="(date, index) in displayedDates"
                :key="index"
                @click="selectedDate = date.value"
                :class="['date-btn-inline', { active: selectedDate === date.value, 'no-schedule': date.hasSchedule === false }]"
                :title="date.hasSchedule ? '' : 'Sellel kuupäeval pole seanssi'"
              >
                <div class="date-day">{{ date.day }}</div>
                <div class="date-number">{{ date.number }}</div>
              </button>
            </div>
            <button @click="nextWeek" class="date-nav-btn-inline">
              <span>›</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Schedule Cards -->
      <div v-if="loading" class="loading">
        Laadimine...
      </div>

      <div v-else-if="error" class="error">
        {{ error }}
      </div>

      <div v-else-if="filteredSessions.length === 0" class="no-sessions">
        Valitud kuupäevaks ei ole seanssi. Proovige muud kuupäeva või filtrit.
      </div>

      <div v-else class="schedule-grid">
        <div v-for="session in filteredSessions" :key="session.id" class="schedule-card">
          <div class="schedule-card-left">
            <!-- Movie Poster -->
            <div class="movie-poster">
              <img :src="session.posterUrl || 'https://via.placeholder.com/200x300'" :alt="session.movieTitle">
            </div>

            <!-- Session Info -->
            <div class="session-info">
              <div class="session-time">{{ session.time }}</div>
              <div class="cinema-name">{{ session.cinema }}</div>
              <div class="hall-name">{{ session.hall }}</div>
              <button class="btn-trailer">Vaata treilerit</button>
            </div>
          </div>

          <div class="schedule-card-right">
            <!-- Movie Title and Genre -->
            <div class="movie-details">
              <h3 class="movie-title">{{ session.movieTitle }}</h3>
              <p class="movie-genre">{{ session.genre }}</p>
              
              <!-- Availability Indicator -->
              <div class="availability-container">
                <div 
                  class="graph js-graph schedule-card__graph" 
                  :data-value="session.availability"
                  :style="{ backgroundColor: getAvailabilityColor(session.availability) }"
                >
                  <div class="graph__circle">
                    <div class="graph__mask graph__mask--full" :style="{ transform: `rotate(${getRotation(session.availability)}deg)` }">
                      <div class="graph__fill" :style="{ transform: `rotate(${getRotation(session.availability)}deg)` }"></div>
                    </div>
                    <div class="graph__mask graph__mask--half">
                      <div class="graph__fill" :style="{ transform: `rotate(${getRotation(session.availability)}deg)` }"></div>
                      <div class="graph__fill graph__fill--fix" :style="{ transform: `rotate(${getRotation(session.availability) * 2}deg)` }"></div>
                    </div>
                  </div>
                  <div class="graph__inset"></div>
                </div>
                <span class="availability-text">{{ session.availableSeats }} vabad kohad</span>
              </div>
            </div>

            <!-- Right Side: Buttons and Meta Info -->
            <div class="right-section">
              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="btn-schedule">Vaata Kava</button>
                <button class="btn-buy" @click="goToBooking(session)">Osta Piletid</button>
              </div>

              <!-- Language, Subtitles, Format -->
              <div class="meta-info">
                <div class="meta-item">
                  <span class="meta-label">Keel:</span>
                  <span class="meta-value">{{ session.language }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Subtiitrid:</span>
                  <span class="meta-value">{{ session.subtitles }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Formaat:</span>
                  <span class="meta-value">{{ session.format }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const DEFAULT_AVAILABILITY_PERCENT = 70
const CURRENT_TIME_UPDATE_INTERVAL = 30000 // 30 seconds in milliseconds
const AGGREGATE_CINEMA_GROUPS = {
  '1004': {
    city: 'tallinn',
    names: ['Solaris', 'Mustamäe', 'Ülemiste', 'Plaza', 'Kristiine']
  },
  '1015': {
    city: 'tartu',
    names: ['Lõunakeskus', 'Eeden', 'Tasku']
  }
}
const CINEMA_NAME_NORMALIZATIONS = {
  kristine: 'kristiine'
}
const normalizeCinemaName = value => (value ?? '')
  .toLowerCase()
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .map(token => CINEMA_NAME_NORMALIZATIONS[token] ?? token)
  .join(' ')

/**
 * Split a normalized cinema name into an array of space-separated tokens, removing empty segments.
 * @param {string} value - Normalized cinema name.
 * @returns {string[]} Tokens for aggregate name matching.
 */
const tokenizeCinemaName = value => (value ?? '').split(' ').filter(Boolean)

/**
 * Get cached token data for a session cinema name, creating it when missing.
 * @param {string} sessionName - Normalized session cinema name.
 * @param {Map<string, {tokens: string[], tokenSet: Set<string>}>} cache - Token cache for this filter run.
 * @returns {{tokens: string[], tokenSet: Set<string>}} Cached token data.
 */
const getSessionTokenData = (sessionName, cache) => {
  let cached = cache.get(sessionName)
  if (!cached) {
    const tokens = tokenizeCinemaName(sessionName)
    cached = { tokens, tokenSet: new Set(tokens) }
    cache.set(sessionName, cached)
  }
  return cached
}

/**
 * Compare selected cinema tokens to a session token set using the shortest-name rule.
 * @param {string[]} selectedTokens - Tokens from the selected cinema.
 * @param {{tokens: string[], tokenSet: Set<string>}} sessionTokenData - Session token cache entry.
 * @returns {boolean} True when the tokens match.
 */
const tokensMatchByShortestName = (selectedTokens, sessionTokenData) => {
  // selectedTokens comes from the chosen cinema; sessionTokenData contains tokens for the session cinema name.
  if (!sessionTokenData || selectedTokens.length === 0 || sessionTokenData.tokens.length === 0) {
    return false
  }
  const minTokenCount = Math.min(selectedTokens.length, sessionTokenData.tokens.length)
  let sharedTokenCount = 0
  for (const token of selectedTokens) {
    if (sessionTokenData.tokenSet.has(token)) {
      sharedTokenCount += 1
      if (sharedTokenCount >= minTokenCount) {
        break
      }
    }
  }
  // Single-token names must match exactly to avoid false positives; multi-token names must share all tokens from the shorter name.
  const isSingleTokenExactMatch = minTokenCount === 1 && sharedTokenCount === 1
  const isMultiTokenSubsetMatch = minTokenCount > 1 && sharedTokenCount >= minTokenCount
  return isSingleTokenExactMatch || isMultiTokenSubsetMatch
}

export default {
  name: 'Schedule',
  data() {
    const today = new Date().toISOString().split('T')[0]
    
    return {
      selectedCinema: '',
      selectedGenre: '',
      selectedFormat: '',
      selectedDate: today,
      currentWeekIndex: 0,
      allDates: [],
      sessions: [],
      scheduleCache: {},
      cinemas: [],
      loading: false,
      error: null,
      cinemaDropdownOpen: false,
      genreDropdownOpen: false,
      formatDropdownOpen: false,
      currentTime: Date.now(),
      currentTimeInterval: null
    }
  },
  created() {
    this.allDates = this.generateDates()
    this.fetchCinemas()
    this.fetchSchedule()
    this.currentTimeInterval = setInterval(() => {
      this.currentTime = Date.now()
    }, CURRENT_TIME_UPDATE_INTERVAL)
    // Close dropdowns when clicking outside
    document.addEventListener('click', this.closeAllDropdowns)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeAllDropdowns)
    if (this.currentTimeInterval) {
      clearInterval(this.currentTimeInterval)
    }
  },
  watch: {
    selectedDate(newDate) {
      this.fetchSchedule(newDate)
    }
  },
  computed: {
    upcomingSessions() {
      // Hide sessions once their start time has been reached.
      return this.sessions.filter(session => session.startTimestamp > this.currentTime)
    },
    displayedDates() {
      const startIndex = this.currentWeekIndex * 7
      const dates = this.allDates.slice(startIndex, startIndex + 7)

      return dates.map(date => {
        const hasCachedDate = Object.prototype.hasOwnProperty.call(this.scheduleCache, date.value)
        const cachedSessions = hasCachedDate ? (this.scheduleCache[date.value] || []) : []
        return {
          ...date,
          hasSchedule: hasCachedDate ? cachedSessions.length > 0 : null
        }
      })
    },
    availableGenres() {
      const genres = new Set()
      this.sessions.forEach(session => {
        this.normalizeGenreList(session.genre).forEach(genre => genres.add(genre))
      })
      return Array.from(genres).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    },
    filteredSessions() {
      const aggregateGroup = AGGREGATE_CINEMA_GROUPS[this.selectedCinema]
      const aggregateGroupCity = aggregateGroup ? aggregateGroup.city : ''
      const aggregateCinemas = aggregateGroup
        ? this.cinemas.filter(cinema => cinema.city?.toLowerCase() === aggregateGroupCity)
        : []
      const selectedCinemaEntry = this.selectedCinema
        ? this.cinemas.find(cinema => cinema.id === this.selectedCinema)
        : null
      const selectedCinemaName = selectedCinemaEntry
        ? normalizeCinemaName(selectedCinemaEntry.name)
        : ''
      const selectedCinemaTokens = selectedCinemaName
        ? tokenizeCinemaName(selectedCinemaName)
        : []
      const normalizedAggregateNames = []
      const aggregateNameTokens = []
      if (aggregateGroup) {
        aggregateGroup.names.forEach(name => {
          const normalized = normalizeCinemaName(name)
          if (normalized) {
            normalizedAggregateNames.push(normalized)
            aggregateNameTokens.push(tokenizeCinemaName(normalized))
          }
        })
      }
      const aggregateCinemaIds = aggregateGroup
        ? new Set(aggregateCinemas.map(cinema => cinema.id))
        : null
      const aggregateCinemaNames = aggregateGroup
        ? new Set([
          ...aggregateCinemas.map(cinema => normalizeCinemaName(cinema.name)).filter(Boolean),
          ...normalizedAggregateNames
        ])
        : null
      const sessionTokenCache = new Map()
      return this.upcomingSessions.filter(session => {
        let matches = true
        
        if (this.selectedCinema) {
          if (aggregateGroup) {
            const sessionCinemaId = session.cinemaId
            const sessionName = normalizeCinemaName(session.cinema)
            const idMatches = aggregateCinemaIds?.has(sessionCinemaId)
            const nameMatches = aggregateCinemaNames?.has(sessionName)
            const sessionTokenData = getSessionTokenData(sessionName, sessionTokenCache)
            // Subset match: all tokens from an aggregate cinema name appear in the session name (e.g. "Apollo Kino" -> "Apollo Kino Solaris").
            const aggregateTokenMatch = aggregateNameTokens?.some(tokens =>
              tokens.every(token => sessionTokenData.tokenSet.has(token))
            )
            if (!idMatches && !nameMatches && !aggregateTokenMatch) {
              matches = false
            }
          } else {
            const sessionName = normalizeCinemaName(session.cinema)
            const sessionTokenData = getSessionTokenData(sessionName, sessionTokenCache)
            // For non-aggregate cinemas, compare directly with the selected cinema ID.
            const idMatches = session.cinemaId === this.selectedCinema
            const nameMatches = sessionName === selectedCinemaName
            const tokenMatch = tokensMatchByShortestName(selectedCinemaTokens, sessionTokenData)
            if (!idMatches && !nameMatches && !tokenMatch) {
              matches = false
            }
          }
        }
        
        if (this.selectedGenre) {
          const selectedGenre = this.selectedGenre.toLowerCase()
          const sessionGenres = this.normalizeGenreList(session.genre)
          const hasGenreMatch = sessionGenres.some(genre => genre.toLowerCase() === selectedGenre)
          if (!hasGenreMatch) {
            matches = false
          }
        }
        
        if (this.selectedFormat && session.format !== this.selectedFormat) {
          matches = false
        }
        
        // Filter by selected date
        if (this.selectedDate && session.date !== this.selectedDate) {
          matches = false
        }
        
        return matches
      })
    },
  },
  methods: {
    closeAllDropdowns(event) {
      if (!event.target.closest('.custom-dropdown')) {
        this.cinemaDropdownOpen = false
        this.genreDropdownOpen = false
        this.formatDropdownOpen = false
      }
    },
    toggleCinemaDropdown(event) {
      event.stopPropagation()
      this.cinemaDropdownOpen = !this.cinemaDropdownOpen
      this.genreDropdownOpen = false
      this.formatDropdownOpen = false
    },
    toggleGenreDropdown(event) {
      event.stopPropagation()
      this.genreDropdownOpen = !this.genreDropdownOpen
      this.cinemaDropdownOpen = false
      this.formatDropdownOpen = false
    },
    toggleFormatDropdown(event) {
      event.stopPropagation()
      this.formatDropdownOpen = !this.formatDropdownOpen
      this.cinemaDropdownOpen = false
      this.genreDropdownOpen = false
    },
    selectCinema(value) {
      this.selectedCinema = value
      this.cinemaDropdownOpen = false
    },
    selectGenre(value) {
      this.selectedGenre = value
      this.genreDropdownOpen = false
    },
    selectFormat(value) {
      this.selectedFormat = value
      this.formatDropdownOpen = false
    },
    formatApolloScheduleDate(dateValue) {
      if (!dateValue) return ''
      const [year, month, day] = dateValue.split('-')
      if (year && month && day) {
        return `${day}.${month}.${year}`
      }
      return dateValue
    },
    normalizeApolloArray(value) {
      if (!value) return []
      return Array.isArray(value) ? value : [value]
    },
    extractApolloShows(schedulePayload) {
      if (!schedulePayload) return []
      const scheduleShows = schedulePayload.Schedule?.Shows?.Show
        ?? schedulePayload.Shows?.Show
        ?? schedulePayload.Shows
        ?? schedulePayload
      return this.normalizeApolloArray(scheduleShows)
    },
    extractApolloEvents(eventsPayload) {
      if (!eventsPayload) return []
      const eventList = eventsPayload.Events?.Event ?? eventsPayload.Event ?? eventsPayload
      return this.normalizeApolloArray(eventList)
    },
    formatApolloGenres(genresValue) {
      if (!genresValue) return ''
      return Array.isArray(genresValue) ? genresValue.join(', ') : String(genresValue)
    },
    normalizeGenreList(genresValue) {
      if (!genresValue) return []
      if (Array.isArray(genresValue)) {
        return genresValue.map(genre => String(genre).trim()).filter(Boolean)
      }
      return String(genresValue)
        .split(',')
        .map(genre => genre.trim())
        .filter(Boolean)
    },
    formatGenreLabel(genre) {
      if (!genre) return ''
      return String(genre)
        .split(' ')
        .map(word => word ? word[0].toUpperCase() + word.slice(1) : '')
        .join(' ')
    },
    formatApolloSubtitles(event, show) {
      const normalizeSubtitle = value => {
        if (!value) return []
        if (Array.isArray(value)) {
          return value.flatMap(normalizeSubtitle)
        }
        if (typeof value === 'object') {
          return normalizeSubtitle(value.Name ?? value.name ?? value.Language ?? value.language)
        }
        return [String(value)]
      }
      const subtitleValues = [
        event?.SubtitleLanguage1?.Name,
        event?.SubtitleLanguage2?.Name,
        event?.SubtitleLanguage1,
        event?.SubtitleLanguage2,
        show?.SubtitleLanguage1?.Name,
        show?.SubtitleLanguage2?.Name,
        show?.SubtitleLanguage1,
        show?.SubtitleLanguage2,
        show?.SubtitleLanguage
      ].flatMap(normalizeSubtitle)
      return subtitleValues.length > 0 ? [...new Set(subtitleValues)].join(', ') : 'Puudub'
    },
    mapApolloScheduleToSessions(schedulePayload, eventsPayload) {
      const shows = this.extractApolloShows(schedulePayload)
      const events = this.extractApolloEvents(eventsPayload)
      const eventMap = new Map(
        events
          .map(event => [event.ID ?? event.EventID, event])
          .filter(([id]) => id != null)
          .map(([id, event]) => [String(id), event])
      )

      return shows.reduce((sessions, show, index) => {
        const startValue = show.dttmShowStart || show.dttmShowStartUTC || show.dttmShowStartLocal
        const startTime = new Date(startValue)
        if (Number.isNaN(startTime.getTime())) {
          console.warn('Invalid schedule start time:', startValue)
          return sessions
        }
        const eventId = show.EventID ?? show.EventId ?? show.Event?.ID
        const event = eventId != null ? eventMap.get(String(eventId)) : null
        const movieTitle = show.EventTitle || show.Title || event?.Title || event?.OriginalTitle || event?.EventTitle || 'Unknown'
        const genre = this.formatApolloGenres(event?.Genres ?? show.Genres)
        const posterUrl = event?.Images?.EventMediumImagePortrait
          || event?.Images?.EventSmallImagePortrait
          || event?.Images?.EventLargeImagePortrait
          || show.EventMediumImagePortrait
          || show.EventSmallImagePortrait
          || show.EventLargeImagePortrait
          || `https://via.placeholder.com/200x300/1a1a2e/e94560?text=${encodeURIComponent(movieTitle || 'No Image')}`
        const language = event?.SpokenLanguage?.Name
          || event?.SpokenLanguage
          || show.SpokenLanguage?.Name
          || show.SpokenLanguage
          || 'Unknown'
        const subtitles = this.formatApolloSubtitles(event, show)
        const presentationMethod = show.PresentationMethod
          || show.PresentationMethodAndLanguage
          || show.PresentationMethod?.Name
          || ''
        const format = typeof presentationMethod === 'string' && presentationMethod.toLowerCase().includes('3d')
          ? '3D'
          : '2D'
        const availableSeatsValue = Number.parseInt(show.SeatsAvailable, 10)
        const availableSeats = Number.isFinite(availableSeatsValue) ? availableSeatsValue : 0
        const totalSeatsValue = Number.parseInt(show.SeatsTotal ?? show.SeatsMax ?? show.TotalSeats, 10)
        const totalSeats = Number.isFinite(totalSeatsValue) ? totalSeatsValue : 0
        const availabilityPercent = totalSeats > 0
          ? Math.round((availableSeats / totalSeats) * 100)
          : DEFAULT_AVAILABILITY_PERCENT
        const hours = startTime.getHours().toString().padStart(2, '0')
        const minutes = startTime.getMinutes().toString().padStart(2, '0')
        const showDate = startTime.toISOString().split('T')[0]
        const cinemaName = show.Theatre?.Name || show.Theatre || show.TheatreName || 'Unknown Cinema'
        const hallName = show.TheatreAuditorium || show.Auditorium || show.AuditoriumName || 'Unknown Hall'
        const cinemaId = show.TheatreID ?? show.Theatre?.ID

        sessions.push({
          id: show.ID || show.ShowID || index,
          movieTitle,
          genre,
          time: `${hours}:${minutes}`,
          cinema: cinemaName,
          cinemaId: cinemaId != null ? String(cinemaId) : '',
          hall: hallName,
          posterUrl,
          language,
          subtitles,
          format,
          availability: availabilityPercent,
          availableSeats,
          date: showDate,
          startTimestamp: startTime.getTime(),
          showUrl: show.ShowURL || show.EventURL || '#'
        })
        return sessions
      }, [])
    },
    async fetchCinemas() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/cinemas`);
        const data = await response.json();
        if (data.success && data.data) {
          this.cinemas = data.data
            .map(cinema => {
              const cinemaId = cinema.id ?? cinema.ID ?? cinema.apolloId;
              if (!cinemaId) return null;
              return {
                id: String(cinemaId),
                name: cinema.Name ?? cinema.name ?? cinema.TheatreName ?? 'Unknown Cinema',
                city: cinema.address?.city ?? cinema.City ?? cinema.city ?? ''
              };
            })
            .filter(Boolean);
        } else {
          this.cinemas = [];
        }
      } catch (err) {
        console.error('Error fetching cinemas:', err);
      }
    },
    async fetchSchedule(date = this.selectedDate) {
      this.loading = true
      this.error = null

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      if (Object.prototype.hasOwnProperty.call(this.scheduleCache, date)) {
        this.sessions = this.scheduleCache[date]
        this.loading = false
        return
      }

      try {
        const scheduleDate = this.formatApolloScheduleDate(date)
        const response = await axios.get(`${apiUrl}/api/apollo-kino/schedule`, {
          params: scheduleDate ? { dt: scheduleDate } : {}
        })

        if (!response.data?.success) {
          this.sessions = []
          this.error = response.data?.error || 'Failed to fetch schedule data'
          return
        }

        const mappedSessions = this.mapApolloScheduleToSessions(response.data.schedule, response.data.events)
        this.sessions = mappedSessions
        this.scheduleCache = {
          ...this.scheduleCache,
          [date]: mappedSessions
        }
      } catch (err) {
        console.error('Error fetching schedule:', err)
        this.sessions = []
        this.error = err.response?.data?.message || err.message || 'Failed to fetch schedule data'
      } finally {
        this.loading = false
      }
    },
    generateDates() {
      const dates = []
      const today = new Date()
      const days = ['P', 'E', 'T', 'K', 'N', 'R', 'L'] // Estonian day abbreviations aligned to Date.getDay() (0=Sunday)
      
      for (let i = 0; i < 14; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push({
          day: days[date.getDay()],
          number: date.getDate(),
          value: date.toISOString().split('T')[0]
        })
      }
      
      return dates
    },
    previousWeek() {
      if (this.currentWeekIndex > 0) {
        this.currentWeekIndex--
      }
    },
    nextWeek() {
      const maxWeekIndex = Math.floor((this.allDates.length - 1) / 7)
      if (this.currentWeekIndex < maxWeekIndex) {
        this.currentWeekIndex++
      }
    },
    goToBooking(session) {
      if (!session) return

      this.$router.push({
        name: 'Booking',
        query: {
          film: session.movieTitle,
          cinema: session.cinema,
          cinemaId: session.cinemaId,
          hall: session.hall,
          posterUrl: session.posterUrl,
          date: session.date,
          time: session.time
        }
      })
    },
    getAvailabilityColor(availability) {
      // Calculate HSL color based on availability percentage
      const hue = (availability / 100) * 120 // 0 (red) to 120 (green)
      return `hsl(${hue}, 77%, 50%)`
    },
    getRotation(availability) {
      // Calculate rotation based on availability percentage
      return (availability / 100) * 180
    }
  }
}
</script>

<style scoped>
.schedule {
  min-height: calc(100vh - 200px);
  background: #f5f5f5;
}

/* Hero Banner */
.hero-banner {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
  position: relative;
  overflow: hidden;
}

.hero-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(45deg, rgba(255, 102, 0, 0.1) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
}

.hero-overlay {
  position: relative;
  z-index: 1;
  padding: 3.5rem 0;
}

.hero-content {
  text-align: center;
  color: #fff;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 0.8rem;
  background: linear-gradient(135deg, #fff 0%, #ff6600 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: #ff6600;
}

.hero-description {
  font-size: 1rem;
  color: #d0d0d0;
  max-width: 550px;
  margin: 0 auto;
}

.container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 1.5rem;
  padding-top: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 0;
  color: #2c3e50;
  font-weight: 700;
}

/* Filters Container */
.filters-container {
  background: #fff;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
  position: relative;
  z-index: 100;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-group-extended {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: flex-end;
}

/* Date Selection Inline (in filters) */
.date-selection-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.date-nav-btn-inline {
  background: #fff;
  border: 2px solid #ff6600;
  color: #ff6600;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-weight: bold;
  min-width: 35px;
}

.date-nav-btn-inline:hover:not(:disabled) {
  background: #ff6600;
  color: #fff;
  transform: translateY(-2px);
}

.date-nav-btn-inline:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.dates-container-inline {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  max-width: 400px;
}

.date-btn-inline {
  background: #fff;
  border: 2px solid #ddd;
  color: #2c3e50;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-width: 55px;
  text-align: center;
}

.date-btn-inline:hover {
  border-color: #ff6600;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.date-btn-inline.active {
  background: #ff6600;
  border-color: #ff6600;
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);
}

.date-btn-inline.no-schedule {
  opacity: 0.4;
  cursor: default;
}

.date-btn-inline.no-schedule:hover {
  background: #fff;
  border-color: #ddd;
  transform: none;
  box-shadow: none;
}

/* Custom Dropdown Styles */
.custom-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid #ff6600;
  border-radius: 8px;
  background: #fff;
  color: #ff6600;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  justify-content: center;
}

.dropdown-btn:hover {
  background: #ff6600;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.dropdown-btn-compact {
  min-width: 140px;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
}

.dropdown-icon {
  font-size: 1rem;
}

.arrow {
  font-size: 0.7rem;
  transition: transform 0.3s ease;
  margin-left: 0.25rem;
}

.custom-dropdown.open .arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 100%;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden;
  animation: dropdownFadeInDown 0.2s ease;
  max-height: 400px;
  overflow-y: auto;
}

@keyframes dropdownFadeInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.dropdown-item {
  padding: 0.75rem 1.25rem;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: #f8f8f8;
  color: #ff6600;
}

.dropdown-item.active {
  background: #fef5f3;
  color: #ff6600;
  font-weight: 600;
}

.date-nav-btn {
  background: #fff;
  border: 2px solid #ff6600;
  color: #ff6600;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 8px;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  font-weight: bold;
}

.date-nav-btn:hover:not(:disabled) {
  background: #ff6600;
  color: #fff;
  transform: translateY(-2px);
}

.date-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.dates-container {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
}

.date-btn {
  background: #fff;
  border: 2px solid #ddd;
  color: #2c3e50;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-width: 65px;
  text-align: center;
}

.date-btn:hover {
  border-color: #ff6600;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.date-btn.active {
  background: #ff6600;
  border-color: #ff6600;
  color: #fff;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.date-btn.no-schedule {
  opacity: 0.4;
  cursor: default;
}

.date-btn.no-schedule:hover {
  background: #fff;
  border-color: #ddd;
  transform: none;
  box-shadow: none;
}

.date-day {
  font-size: 0.85rem;
  font-weight: 600;
}

.date-number {
  font-size: 1.1rem;
  font-weight: bold;
  margin-top: 0.25rem;
}

/* Schedule Grid */
.schedule-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading,
.error,
.no-sessions {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  color: #2c3e50;
}

.error {
  color: #e65c00;
  background: #fee;
  border: 1px solid #fcc;
}

.no-sessions {
  color: #7f8c8d;
}

.schedule-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 1.5rem;
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;
}

.schedule-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.schedule-card-left {
  display: flex;
  gap: 1rem;
}

.movie-poster {
  width: 120px;
  flex-shrink: 0;
}

.movie-poster img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-time {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
}

.cinema-name {
  font-size: 0.95rem;
  color: #555;
  font-weight: bold;
}

.hall-name {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: bold;
}

.btn-trailer {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fef5f3;
  border: 1px solid #fdd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  color: #ff6600;
  transition: all 0.3s;
}

.btn-trailer:hover {
  background: #ff6600;
  color: #fff;
  border-color: #ff6600;
}

/* Right Side */
.schedule-card-right {
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.movie-details {
  flex: 1;
  min-width: 0;
}

.movie-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.movie-genre {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 1rem;
  font-weight: bold;
}

/* Availability Container */
.availability-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

/* Right Section - Buttons and Meta */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 250px;
  align-self: flex-end;
}

.graph {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  flex-shrink: 0;
}

.graph__circle {
  position: absolute;
  width: 100%;
  height: 100%;
}

.graph__mask {
  position: absolute;
  width: 100%;
  height: 100%;
  clip: rect(0, 60px, 60px, 30px);
}

.graph__mask--full {
  transform: rotate(0deg);
}

.graph__mask--half {
  clip: rect(0, 30px, 60px, 0);
}

.graph__fill {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: inherit;
  clip: rect(0, 30px, 60px, 0);
}

.graph__fill--fix {
  transform: rotate(180deg);
}

.graph__inset {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 50%;
}

.availability-text {
  font-size: 0.9rem;
  color: #555;
  white-space: nowrap;
  font-weight: bold;
}

/* Session Meta */
.meta-info {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  justify-content: space-between;
  width: 100%;
}

.meta-item {
  display: flex;
  gap: 0.5rem;
  font-size: 1.1rem;
  align-items: center;
}

.meta-label {
  font-weight: 700;
  color: #7f8c8d;
}

.meta-value {
  color: #2c3e50;
  font-weight: 600;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-schedule {
  padding: 0.75rem 1.5rem;
  background-color: #f39c12;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-schedule:hover {
  background-color: #e67e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.btn-buy {
  padding: 0.75rem 1.5rem;
  background-color: #ff6600;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-buy:hover {
  background-color: #e65c00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
  }

  .filter-group,
  .filter-group-extended {
    flex-direction: column;
    width: 100%;
    gap: 0.75rem;
    justify-content: center;
  }

  .filter-section {
    width: 100%;
  }

  .custom-dropdown {
    width: 100%;
  }

  .dropdown-btn,
  .dropdown-btn-compact {
    width: 100%;
    min-width: 100%;
  }

  .date-selection-inline {
    flex-direction: column;
    width: 100%;
    margin-left: 0;
  }

  .dates-container-inline {
    max-width: 100%;
    width: 100%;
    overflow-x: auto;
  }

  .schedule-card {
    flex-direction: column;
  }

  .schedule-card-left {
    flex-direction: column;
    align-items: center;
  }

  .schedule-card-right {
    flex-direction: column;
    gap: 1rem;
  }

  .right-section {
    width: 100%;
    min-width: 100%;
  }

  .meta-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-buttons {
    width: 100%;
    flex-direction: row;
  }

  .btn-schedule,
  .btn-buy {
    flex: 1;
  }

  .dates-container {
    overflow-x: auto;
  }
}
</style>
