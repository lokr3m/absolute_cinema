<template>
  <div class="booking-page">
    <div class="page-header">
      <div class="container">
        <h1>🎟️ Booking</h1>
        <p class="subtitle">Book your tickets in a few easy steps</p>
      </div>
    </div>
    <div class="booking">
      <div class="container">
      
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="loading" class="loading-message">Loading...</div>
      
        <div class="booking-steps">
          <div class="step" :class="{ active: currentStep === 1 }">
            <span class="step-number">1</span>
            <span class="step-label">Select Tickets</span>
          </div>
          <div class="step" :class="{ active: currentStep === 2 }">
            <span class="step-number">2</span>
            <span class="step-label">Select Seats</span>
          </div>
          <div class="step" :class="{ active: currentStep === 3 }">
            <span class="step-number">3</span>
            <span class="step-label">Email</span>
          </div>
        </div>

      <div class="booking-content">
        <div class="main-content">
          <div v-if="currentStep === 1" class="step-content">
            <h2>Select Tickets</h2>
            <div class="ticket-selection">
              <p v-if="!selectedSession" class="info-text">
                Please choose a session from the Schedule page in the main navigation to start booking tickets.
              </p>
              <div v-else>
                <div class="ticket-row" v-for="type in ticketTypes" :key="type.key">
                  <div class="ticket-info">
                    <span class="ticket-name">{{ type.label }}</span>
                    <span class="ticket-price">€{{ ticketPrice.toFixed(2) }}</span>
                  </div>
                  <input
                    type="number"
                    class="ticket-quantity"
                    min="0"
                    :max="maxAvailableTickets"
                    v-model.number="ticketSelections[type.key]"
                    @change="onTicketCountChange"
                    :disabled="loading || !selectedSession"
                  >
                </div>
                <p class="info-text">
                  Choose how many tickets you want before selecting your seats.
                </p>
              </div>
            </div>
          </div>

          <div v-if="currentStep === 2" class="step-content">
            <h2>Select Your Seats</h2>
            <p v-if="seatHoldRemaining !== null" class="seat-timer">
              Time left: {{ formattedSeatHoldRemaining }}
            </p>
            <p v-if="totalTickets" class="info-text">
              Select exactly {{ totalTickets }} {{ seatLabel(totalTickets) }}.
            </p>
            <p v-else class="info-text">
              Please choose ticket quantities before selecting seats.
            </p>
            <div v-if="totalTickets && seatLayout" class="seat-selection">
              <div class="screen">SCREEN</div>
              <div class="seating-chart">
                <div class="row" v-for="row in seatLayout.rows" :key="row">
                  <span class="row-label">{{ String.fromCharCode(64 + row) }}</span>
                  <button 
                    v-for="seat in seatLayout.seatsPerRow" 
                    :key="seat"
                    class="seat"
                    :class="{ 
                      selected: isSelected(row, seat),
                      occupied: isOccupied(row, seat)
                    }"
                    @click="toggleSeat(row, seat)"
                    :disabled="isOccupied(row, seat) || isSeatSelectionDisabled(row, seat)"
                  >
                    {{ seat }}
                  </button>
                </div>
              </div>
              <div class="legend">
                <div class="legend-item">
                  <span class="seat-example available"></span>
                  <span>Available</span>
                </div>
                <div class="legend-item">
                  <span class="seat-example selected"></span>
                  <span>Selected</span>
                </div>
                <div class="legend-item">
                  <span class="seat-example occupied"></span>
                  <span>Occupied</span>
                </div>
              </div>
            </div>
            <div v-else-if="totalTickets" class="loading-message">Loading seat layout...</div>
          </div>

          <div v-if="currentStep === 3" class="step-content">
            <h2>Confirm Your Email</h2>
            <form class="payment-form" @submit.prevent="confirmBooking">
              <div class="form-group">
                <label>Email: *</label>
                <input type="email" v-model="paymentInfo.email" placeholder="john@example.com" required>
              </div>
            </form>
          </div>

          <div class="navigation-buttons">
            <button v-if="currentStep > 1" @click="previousStep" class="btn btn-secondary" :disabled="loading">
              Previous
            </button>
            <button v-if="currentStep < 3" @click="nextStep" class="btn btn-primary" :disabled="loading || (currentStep === 1 && !canProceedToStep2)">
              Next
            </button>
            <button v-if="currentStep === 3" @click="confirmBooking" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Processing...' : 'Ok' }}
            </button>
          </div>
        </div>

        <div class="booking-summary">
          <div v-if="summaryPosterUrl" class="summary-poster">
            <img :src="summaryPosterUrl" :alt="summaryFilmTitle">
          </div>
          <h3>Booking Summary</h3>
          <div class="summary-item" v-if="summaryFilmTitle">
            <span>Film:</span>
            <span>{{ summaryFilmTitle }}</span>
          </div>
          <div class="summary-item" v-if="summaryCinemaName">
            <span>Cinema:</span>
            <span>{{ summaryCinemaName }}</span>
          </div>
          <div class="summary-item" v-if="summaryHallName">
            <span>Hall:</span>
            <span>{{ summaryHallName }}</span>
          </div>
          <div class="summary-item" v-if="selectedDate">
            <span>Date:</span>
            <span>{{ selectedDate }}</span>
          </div>
          <div class="summary-item" v-if="selectedSession && getSelectedSessionDetails()">
            <span>Time:</span>
            <span>{{ formatSessionTime(getSelectedSessionDetails()) }}</span>
          </div>
          <div class="summary-item" v-if="totalTickets">
            <span>Tickets:</span>
            <span>{{ ticketSummary }}</span>
          </div>
          <div class="summary-item" v-if="selectedSeats.length > 0">
            <span>Seats:</span>
            <span>{{ selectedSeats.length }} / {{ totalTickets }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-item total">
            <span>Total:</span>
            <span>€{{ total }}</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'
const SEAT_HOLD_DURATION_MINUTES = 15
const SEAT_HOLD_DURATION_SECONDS = SEAT_HOLD_DURATION_MINUTES * 60
const SEAT_HOLD_DURATION_MS = SEAT_HOLD_DURATION_SECONDS * 1000

export default {
  name: 'Booking',
  data() {
    return {
      currentStep: 1,
      films: [],
      cinemas: [],
      halls: [],
      sessions: [],
      selectedFilm: null,
      selectedCinema: null,
      selectedHall: null,
      selectedSession: null,
      selectedDate: this.getTodayDate(),
      seatLayout: null,
      occupiedSeats: [],
      selectedSeats: [],
      ticketTypes: [
        { key: 'adult', label: 'Adult' },
        { key: 'child', label: 'Child' },
        { key: 'vip', label: 'VIP' }
      ],
      ticketSelections: {
        adult: 0,
        child: 0,
        vip: 0
      },
      prefillFilmTitle: '',
      prefillCinemaName: '',
      prefillHallName: '',
      prefillPosterUrl: '',
      seatHoldExpiresAt: null,
      seatHoldRemaining: null,
      seatHoldIntervalId: null,
      paymentInfo: {
        email: ''
      },
      loading: false,
      error: null
    }
  },
  computed: {
    ticketPrice() {
      const session = this.getSelectedSessionDetails()
      const price = session?.price?.standard
      return Number(price) || 9.50
    },
    totalTickets() {
      return Object.values(this.ticketSelections).reduce((total, count) => total + count, 0)
    },
    total() {
      return (this.totalTickets * this.ticketPrice).toFixed(2)
    },
    canProceedToStep2() {
      return this.selectedSession && this.totalTickets > 0
    },
    ticketSummary() {
      const parts = this.ticketTypes
        .map(type => ({ label: type.label, count: this.ticketSelections[type.key] }))
        .filter(item => item.count > 0)
        .map(item => `${item.count} ${item.label}`)
      return parts.join(', ')
    },
    summaryFilmTitle() {
      const film = this.films.find(item => item._id === this.selectedFilm)
      return film?.title || this.prefillFilmTitle
    },
    summaryPosterUrl() {
      const film = this.films.find(item => item._id === this.selectedFilm)
      if (film?.posterUrl) {
        return film.posterUrl
      }
      if (this.prefillPosterUrl) {
        return this.prefillPosterUrl
      }
      if (this.summaryFilmTitle) {
        return `https://via.placeholder.com/300x450/1a1a2e/e94560?text=${encodeURIComponent(this.summaryFilmTitle)}`
      }
      return ''
    },
    summaryCinemaName() {
      return this.getCinemaName(this.selectedCinema) || this.prefillCinemaName
    },
    summaryHallName() {
      return this.getHallName(this.selectedHall) || this.prefillHallName
    },
    formattedSeatHoldRemaining() {
      if (this.seatHoldRemaining === null) return ''
      const minutes = Math.floor(this.seatHoldRemaining / 60)
      const seconds = this.seatHoldRemaining % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },
    maxAvailableTickets() {
      const session = this.getSelectedSessionDetails()
      return session?.availableSeats ?? undefined
    },
    filteredSessions() {
      if (!this.sessions.length) return []
      
      return this.sessions.filter(session => {
        const matchesFilm = !this.selectedFilm || session.film._id === this.selectedFilm
        const sessionCinemaId = session.hall?.cinema?.apolloId ?? session.hall?.cinema?._id
        const matchesCinema = !this.selectedCinema || sessionCinemaId === this.selectedCinema
        const matchesHall = !this.selectedHall || 
          (session.hall && session.hall._id === this.selectedHall)
        
        return matchesFilm && matchesCinema && matchesHall
      })
    }
  },
  watch: {
    totalTickets(newValue) {
      if (newValue === 0) {
        this.selectedSeats = []
        return
      }
      if (this.selectedSeats.length > newValue) {
        this.selectedSeats = this.selectedSeats.slice(0, newValue)
      }
    }
  },
  async mounted() {
    await this.loadFilms()
    await this.loadCinemas()
    await this.applyPrefillFromQuery()
  },
  beforeUnmount() {
    this.clearSeatHoldTimer()
  },
  methods: {
    normalizeTime(value) {
      if (!value) return ''

      const match = value.toString().match(/^(\d{1,2}):(\d{2})$/)
      if (!match) return ''

      return `${match[1].padStart(2, '0')}:${match[2]}`
    },
    getTodayDate() {
      const today = new Date()
      return today.toISOString().split('T')[0]
    },
    async loadFilms() {
      try {
        this.loading = true
        const response = await axios.get(`${API_BASE_URL}/films`)
        this.films = response.data.data || []
      } catch (error) {
        console.error('Error loading films:', error)
        this.error = 'Failed to load films'
      } finally {
        this.loading = false
      }
    },
    async loadCinemas() {
      try {
        this.loading = true
        const response = await axios.get(`${API_BASE_URL}/cinemas`)
        const cinemas = response.data.data || []
        this.cinemas = cinemas.map(cinema => {
          const cinemaId = cinema.ID ?? cinema.apolloId ?? cinema._id ?? cinema.id
          return {
            id: cinemaId ? String(cinemaId) : '',
            name: cinema.Name ?? cinema.name ?? cinema.TheatreName ?? 'Unknown Cinema'
          }
        })
      } catch (error) {
        console.error('Error loading cinemas:', error)
        this.error = 'Failed to load cinemas'
      } finally {
        this.loading = false
      }
    },
    async applyPrefillFromQuery() {
      const { film, cinema, cinemaId, date, time, hall, posterUrl } = this.$route.query
      const filmName = Array.isArray(film) ? film[0] : film
      const cinemaName = Array.isArray(cinema) ? cinema[0] : cinema
      const cinemaKey = Array.isArray(cinemaId) ? cinemaId[0] : cinemaId
      const normalizedCinemaKey = cinemaKey ? String(cinemaKey) : ''
      const dateValue = Array.isArray(date) ? date[0] : date
      const timeValue = Array.isArray(time) ? time[0] : time
      const hallName = Array.isArray(hall) ? hall[0] : hall
      const posterValue = Array.isArray(posterUrl) ? posterUrl[0] : posterUrl

      this.prefillFilmTitle = filmName || ''
      this.prefillCinemaName = cinemaName || ''
      this.prefillHallName = hallName || ''
      this.prefillPosterUrl = posterValue || ''

      if (dateValue) {
        this.selectedDate = dateValue
      }

      if (filmName) {
        const filmMatch = this.films.find(item => item.title?.toLowerCase() === filmName.toLowerCase())
        if (filmMatch) {
          this.selectedFilm = filmMatch._id
        }
      }

      if (normalizedCinemaKey) {
        const cinemaMatch = this.cinemas.find(item => item.id === normalizedCinemaKey)
        if (cinemaMatch) {
          this.selectedCinema = cinemaMatch.id
        }
      }

      if (!this.selectedCinema && cinemaName) {
        const cinemaMatch = this.cinemas.find(item => item.name?.toLowerCase() === cinemaName.toLowerCase())
        if (cinemaMatch) {
          this.selectedCinema = cinemaMatch.id
        }
      }

      if (this.selectedCinema) {
        await this.loadHalls()
      }

      if (this.selectedFilm) {
        await this.loadSessions()
      }

      const normalizedTime = this.normalizeTime(timeValue)
      if (normalizedTime) {
        const sessionsToSearch = this.filteredSessions.length ? this.filteredSessions : this.sessions
        let sessionMatch = sessionsToSearch.find(
          session => {
            const matchesTime = this.formatSessionTime(session) === normalizedTime
            const matchesHall = !hallName || session.hall?.name?.toLowerCase() === hallName.toLowerCase()
            return matchesTime && matchesHall
          }
        )

        if (!sessionMatch && hallName) {
          const timeMatches = sessionsToSearch.filter(
            session => this.formatSessionTime(session) === normalizedTime
          )
          if (timeMatches.length > 1) {
            const hallNames = timeMatches
              .map(session => session.hall?.name)
              .filter(Boolean)
              .join(', ')
            console.warn(
              `Multiple sessions matched by time only (${timeMatches.length}). Halls: ${hallNames || 'Unknown'}. Selecting the first match.`
            )
          }
          if (timeMatches.length > 0) {
            sessionMatch = timeMatches[0]
          }
        }

        if (sessionMatch) {
          this.selectedSession = sessionMatch._id
          if (sessionMatch.hall?._id) {
            this.selectedHall = sessionMatch.hall._id
          }
          await this.loadSeatLayout()
        }
      }
    },
    async loadHalls() {
      if (!this.selectedCinema) {
        this.halls = []
        return
      }
      
      try {
        this.loading = true
        const response = await axios.get(`${API_BASE_URL}/cinemas/${this.selectedCinema}/halls`)
        this.halls = response.data.data || []
      } catch (error) {
        console.error('Error loading halls:', error)
        this.error = 'Failed to load halls'
        this.halls = []
      } finally {
        this.loading = false
      }
    },
    async loadSessions() {
      if (!this.selectedFilm || !this.selectedDate) {
        this.sessions = []
        return
      }
      
      try {
        this.loading = true
        const params = {
          filmId: this.selectedFilm,
          date: this.selectedDate
        }
        
        if (this.selectedHall) {
          params.hallId = this.selectedHall
        }
        
        const response = await axios.get(`${API_BASE_URL}/sessions`, { params })
        this.sessions = response.data.data || []
      } catch (error) {
        console.error('Error loading sessions:', error)
        this.error = 'Failed to load sessions'
        this.sessions = []
      } finally {
        this.loading = false
      }
    },
    async loadSeatLayout() {
      if (!this.selectedSession) return
      
      try {
        this.loading = true
        const response = await axios.get(`${API_BASE_URL}/sessions/${this.selectedSession}/seats`)
        this.seatLayout = response.data.data.layout
        this.occupiedSeats = response.data.data.occupied.map(s => [s.row, s.number])
        this.selectedSeats = []
      } catch (error) {
        console.error('Error loading seat layout:', error)
        this.error = 'Failed to load seat layout'
      } finally {
        this.loading = false
      }
    },
    onTicketCountChange() {
      const maxTickets = this.maxAvailableTickets
      Object.keys(this.ticketSelections).forEach(key => {
        const value = Number(this.ticketSelections[key])
        if (!Number.isFinite(value) || value <= 0) {
          this.ticketSelections[key] = 0
          return
        }
        if (maxTickets !== undefined && value > maxTickets) {
          this.ticketSelections[key] = maxTickets
          return
        }
        this.ticketSelections[key] = value
      })
    },
    startSeatHoldTimer() {
      this.clearSeatHoldTimer()
      this.seatHoldExpiresAt = Date.now() + SEAT_HOLD_DURATION_MS
      this.seatHoldRemaining = SEAT_HOLD_DURATION_SECONDS
      this.seatHoldIntervalId = setInterval(() => {
        const remaining = Math.max(0, Math.floor((this.seatHoldExpiresAt - Date.now()) / 1000))
        this.seatHoldRemaining = remaining
        if (remaining <= 0) {
          this.handleSeatHoldExpired()
        }
      }, 1000)
    },
    clearSeatHoldTimer() {
      if (this.seatHoldIntervalId) {
        clearInterval(this.seatHoldIntervalId)
      }
      this.seatHoldIntervalId = null
      this.seatHoldExpiresAt = null
      this.seatHoldRemaining = null
    },
    handleSeatHoldExpired() {
      this.clearSeatHoldTimer()
      this.selectedSeats = []
      Object.keys(this.ticketSelections).forEach(key => {
        this.ticketSelections[key] = 0
      })
      this.currentStep = 1
      alert('Your 15-minute booking time has expired and your selections were cleared. Please choose your tickets again.')
    },
    async onFilmChange() {
      this.selectedSession = null
      await this.loadSessions()
    },
    async onCinemaChange() {
      this.selectedHall = null
      this.selectedSession = null
      this.halls = []
      await this.loadHalls()
      await this.loadSessions()
    },
    async onHallChange() {
      this.selectedSession = null
      await this.loadSessions()
    },
    async onDateChange() {
      this.selectedSession = null
      await this.loadSessions()
    },
    async onSessionChange() {
      if (this.selectedSession) {
        await this.loadSeatLayout()
      }
    },
    async nextStep() {
      if (this.currentStep === 1) {
        if (!this.selectedSession) {
          alert('Please choose a session from the Schedule page in the main navigation to continue')
          return
        }
        if (this.totalTickets === 0) {
          alert('Please select at least one ticket to continue')
          return
        }
        await this.loadSeatLayout()
        this.startSeatHoldTimer()
      } else if (this.currentStep === 2) {
        if (this.selectedSeats.length !== this.totalTickets) {
          alert(`Please select exactly ${this.totalTickets} ${this.seatLabel(this.totalTickets)}`)
          return
        }
        this.clearSeatHoldTimer()
      }
      
      if (this.currentStep < 3) {
        this.currentStep++
      }
    },
    previousStep() {
      if (this.currentStep > 1) {
        if (this.currentStep === 2) {
          this.clearSeatHoldTimer()
        }
        this.currentStep--
      }
    },
    isSelected(row, seat) {
      return this.selectedSeats.some(s => s.row === row && s.number === seat)
    },
    isOccupied(row, seat) {
      return this.occupiedSeats.some(s => s[0] === row && s[1] === seat)
    },
    isSeatSelectionDisabled(row, seat) {
      if (!this.totalTickets) {
        return true
      }
      if (this.isSelected(row, seat)) {
        return false
      }
      return this.selectedSeats.length >= this.totalTickets
    },
    toggleSeat(row, seat) {
      const index = this.selectedSeats.findIndex(s => s.row === row && s.number === seat)
      if (index > -1) {
        this.selectedSeats.splice(index, 1)
      } else {
        if (!this.totalTickets) {
          return
        }
        if (this.selectedSeats.length >= this.totalTickets) {
          alert(`You can only select ${this.totalTickets} ${this.seatLabel(this.totalTickets)}`)
          return
        }
        this.selectedSeats.push({ row, number: seat })
      }
    },
    async confirmBooking() {
      if (!this.paymentInfo.email) {
        alert('Please enter your email')
        return
      }
      
      try {
        this.loading = true
        const bookingData = {
          sessionId: this.selectedSession,
          seats: this.selectedSeats,
          contactEmail: this.paymentInfo.email
        }
        
        const response = await axios.post(`${API_BASE_URL}/bookings`, bookingData)
        
        if (response.data.success) {
          alert(`Booking confirmed! Your booking number is: ${response.data.data.bookingNumber}\nTotal: €${response.data.data.totalPrice}`)
          this.$router.push('/')
        }
      } catch (error) {
        console.error('Error creating booking:', error)
        const errorMsg = error.response?.data?.error || 'Failed to create booking'
        alert(`Error: ${errorMsg}`)
      } finally {
        this.loading = false
      }
    },
    getFilmTitle(filmId) {
      const film = this.films.find(f => f._id === filmId)
      return film ? film.title : ''
    },
    getCinemaName(cinemaId) {
      const cinema = this.cinemas.find(c => c.id === cinemaId)
      return cinema ? cinema.name : ''
    },
    getHallName(hallId) {
      const hall = this.halls.find(h => h._id === hallId)
      return hall ? hall.name : ''
    },
    formatSessionTime(session) {
      if (!session || !session.startTime) return ''
      const date = new Date(session.startTime)
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    },
    seatLabel(count) {
      return count === 1 ? 'seat' : 'seats'
    },
    getSelectedSessionDetails() {
      const session = this.sessions.find(s => s._id === this.selectedSession)
      return session || null
    }
  }
}
</script>

<style scoped>
.booking-page {
  min-height: calc(100vh - 200px);
  background: #f5f5f5;
}

.page-header {
  background: linear-gradient(135deg, #121212 0%, #242424 50%, #121212 100%);
  padding: 4rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(45deg, rgba(255, 102, 0, 0.1) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 0h2v20H9V0zm25.134.84l1.732 1-10 17.32-1.732-1 10-17.32zm-20 20l1.732 1-10 17.32-1.732-1 10-17.32zM58.16 4.134l1 1.732-17.32 10-1-1.732 17.32-10zm-40 40l1 1.732-17.32 10-1-1.732 17.32-10zM80 9v2H60V9h20zM20 69v2H0v-2h20zm79.32-55l-1 1.732-17.32-10L82 4l17.32 10zm-80 80l-1 1.732-17.32-10L2 84l17.32 10zm96.546-75.84l-1.732 1-10-17.32 1.732-1 10 17.32zm-100 100l-1.732 1-10-17.32 1.732-1 10 17.32zM38.16 24.134l1 1.732-17.32 10-1-1.732 17.32-10zM60 29v2H40v-2h20zm19.32 5l-1 1.732-17.32-10L62 24l17.32 10zm16.546 4.16l-1.732 1-10-17.32 1.732-1 10 17.32zM111 40h-2V20h2v20zm3.134.84l1.732 1-10 17.32-1.732-1 10-17.32zM40 49v2H20v-2h20zm19.32 5l-1 1.732-17.32-10L42 44l17.32 10zm16.546 4.16l-1.732 1-10-17.32 1.732-1 10 17.32zM91 60h-2V40h2v20zm3.134.84l1.732 1-10 17.32-1.732-1 10-17.32zm24.026 3.294l1 1.732-17.32 10-1-1.732 17.32-10zM39.32 74l-1 1.732-17.32-10L22 64l17.32 10zm16.546 4.16l-1.732 1-10-17.32 1.732-1 10 17.32zM71 80h-2V60h2v20zm3.134.84l1.732 1-10 17.32-1.732-1 10-17.32zm24.026 3.294l1 1.732-17.32 10-1-1.732 17.32-10zM120 89v2h-20v-2h20zm-84.134 9.16l-1.732 1-10-17.32 1.732-1 10 17.32zM51 100h-2V80h2v20zm3.134.84l1.732 1-10 17.32-1.732-1 10-17.32zm24.026 3.294l1 1.732-17.32 10-1-1.732 17.32-10zM100 109v2H80v-2h20zm19.32 5l-1 1.732-17.32-10 1-1.732 17.32 10zM31 120h-2v-20h2v20z' fill='%23ffffff' fill-opacity='0.025' fill-rule='evenodd'/%3E%3C/svg%3E");
}

.page-header .container {
  position: relative;
  z-index: 1;
}

.page-header h1 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff 0%, #ff6600 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header .subtitle {
  color: #d8d8d8;
  font-size: 1.2rem;
}

.booking {
  padding: 2.5rem 0 3rem;
  color: #2c3e50;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.error-message {
  background: #fee;
  color: #e65c00;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid #fcc;
}

.loading-message {
  background: #fff;
  color: #2c3e50;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid #e8e8e8;
  text-align: center;
}

.info-text {
  color: #7f8c8d;
  font-style: italic;
  margin-top: 0.5rem;
}

.ticket-selection {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.ticket-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.ticket-row:last-of-type {
  border-bottom: none;
}

.ticket-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ticket-name {
  font-weight: 600;
  color: #2c3e50;
}

.ticket-price {
  color: #ff6600;
  font-weight: 700;
}

.ticket-quantity {
  width: 90px;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  text-align: center;
}

.seat-timer {
  background: #fff5eb;
  color: #d35400;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  margin-bottom: 1rem;
  border: 1px solid #ffd7b5;
  width: fit-content;
}

.booking-steps {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
  background: #fff;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
  flex-wrap: wrap;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #7f8c8d;
}

.step.active {
  color: #ff6600;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #7f8c8d;
}

.step.active .step-number {
  background: #ff6600;
  color: #fff;
}

.booking-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.main-content {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
}

.step-content h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  color: #2c3e50;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #ff6600;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.form-group input::placeholder {
  color: #95a5a6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.screen {
  background: #ff6600;
  color: #fff;
  text-align: center;
  padding: 1rem;
  margin-bottom: 2rem;
  border-radius: 8px;
  font-weight: bold;
}

.seating-chart {
  margin-bottom: 2rem;
}

.row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  justify-content: center;
}

.row-label {
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #555;
}

.seat {
  width: 40px;
  height: 40px;
  border: 2px solid #ddd;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  color: #2c3e50;
}

.seat:hover:not(:disabled) {
  background: #ff6600;
  color: #fff;
  border-color: #ff6600;
}

.seat.selected {
  background: #ff6600;
  color: #fff;
  border-color: #ff6600;
}

.seat.occupied {
  background: #e8e8e8;
  border-color: #ccc;
  cursor: not-allowed;
  color: #999;
}

.legend {
  display: flex;
  gap: 2rem;
  justify-content: center;
  color: #555;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.seat-example {
  width: 30px;
  height: 30px;
  border: 2px solid #ddd;
  border-radius: 8px;
}

.seat-example.available {
  background: #fff;
}

.seat-example.selected {
  background: #ff6600;
  border-color: #ff6600;
}

.seat-example.occupied {
  background: #e8e8e8;
  border-color: #ccc;
}

.navigation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #ff6600;
  color: #fff;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: #e65c00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.5);
}

.btn-secondary {
  background: #fff;
  border: 2px solid #ddd;
  color: #555;
}

.btn-secondary:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #bbb;
}

.booking-summary {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  height: fit-content;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
}

.summary-poster {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.summary-poster img {
  width: 100%;
  display: block;
}

.booking-summary h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: #555;
}

.summary-divider {
  border-top: 2px solid #e8e8e8;
  margin: 1rem 0;
}

.summary-item.total {
  font-size: 1.3rem;
  font-weight: bold;
  color: #2c3e50;
}

@media (max-width: 968px) {
  .booking-content {
    grid-template-columns: 1fr;
  }
}
</style>
