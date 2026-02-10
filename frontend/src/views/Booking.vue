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
          <span class="step-label">Select Movie & Session</span>
        </div>
        <div class="step" :class="{ active: currentStep === 2 }">
          <span class="step-number">2</span>
          <span class="step-label">Select Seats</span>
        </div>
        <div class="step" :class="{ active: currentStep === 3 }">
          <span class="step-number">3</span>
          <span class="step-label">Payment</span>
        </div>
      </div>

      <div class="booking-content">
        <div class="main-content">
          <div v-if="currentStep === 1" class="step-content">
            <h2>Select Movie & Session</h2>
            <div class="movie-selection">
              <div class="form-group">
                <label>Film:</label>
                <select v-model="selectedFilm" @change="onFilmChange" :disabled="loading">
                  <option :value="null">Choose a film</option>
                  <option v-for="film in films" :key="film._id" :value="film._id">
                    {{ film.title }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Cinema:</label>
                <select v-model="selectedCinema" @change="onCinemaChange" :disabled="loading">
                  <option :value="null">Choose a cinema</option>
                  <option v-for="cinema in cinemas" :key="cinema._id" :value="cinema._id">
                    {{ cinema.name }}
                  </option>
                </select>
              </div>

              <div class="form-group" v-if="selectedCinema">
                <label>Hall:</label>
                <select v-model="selectedHall" @change="onHallChange" :disabled="loading || !halls.length">
                  <option :value="null">Choose a hall</option>
                  <option v-for="hall in halls" :key="hall._id" :value="hall._id">
                    {{ hall.name }} ({{ hall.screenType }})
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Date:</label>
                <input type="date" v-model="selectedDate" @change="onDateChange" :disabled="loading" :min="getTodayDate()">
              </div>

              <div class="form-group" v-if="selectedFilm && selectedDate">
                <label>Session:</label>
                <select v-model="selectedSession" @change="onSessionChange" :disabled="loading || !filteredSessions.length">
                  <option :value="null">Choose a session</option>
                  <option v-for="session in filteredSessions" :key="session._id" :value="session._id">
                    {{ formatSessionTime(session) }} - 
                    {{ session.hall ? session.hall.name : 'N/A' }} - 
                    €{{ session.price?.standard || 'N/A' }}
                  </option>
                </select>
                <p v-if="!filteredSessions.length && selectedFilm" class="info-text">
                  No sessions available for the selected criteria
                </p>
              </div>
            </div>
          </div>

          <div v-if="currentStep === 2" class="step-content">
            <h2>Select Your Seats</h2>
            <div v-if="seatLayout" class="seat-selection">
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
                    :disabled="isOccupied(row, seat)"
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
            <div v-else class="loading-message">Loading seat layout...</div>
          </div>

          <div v-if="currentStep === 3" class="step-content">
            <h2>Payment Details</h2>
            <form class="payment-form" @submit.prevent="confirmBooking">
              <div class="form-group">
                <label>Full Name: *</label>
                <input type="text" v-model="paymentInfo.name" placeholder="John Doe" required>
              </div>
              <div class="form-group">
                <label>Email: *</label>
                <input type="email" v-model="paymentInfo.email" placeholder="john@example.com" required>
              </div>
              <div class="form-group">
                <label>Phone:</label>
                <input type="tel" v-model="paymentInfo.phone" placeholder="+372 1234 5678">
              </div>
              <div class="form-group">
                <label>Card Number:</label>
                <input type="text" v-model="paymentInfo.cardNumber" placeholder="1234 5678 9012 3456">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Expiry Date:</label>
                  <input type="text" v-model="paymentInfo.expiry" placeholder="MM/YY">
                </div>
                <div class="form-group">
                  <label>CVV:</label>
                  <input type="text" v-model="paymentInfo.cvv" placeholder="123">
                </div>
              </div>
            </form>
          </div>

          <div class="navigation-buttons">
            <button v-if="currentStep > 1" @click="previousStep" class="btn btn-secondary" :disabled="loading">
              Previous
            </button>
            <button v-if="currentStep < 3" @click="nextStep" class="btn btn-primary" :disabled="loading">
              Next
            </button>
            <button v-if="currentStep === 3" @click="confirmBooking" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Processing...' : 'Confirm Booking' }}
            </button>
          </div>
        </div>

        <div class="booking-summary">
          <h3>Booking Summary</h3>
          <div class="summary-item" v-if="selectedFilm">
            <span>Film:</span>
            <span>{{ getFilmTitle(selectedFilm) }}</span>
          </div>
          <div class="summary-item" v-if="selectedCinema">
            <span>Cinema:</span>
            <span>{{ getCinemaName(selectedCinema) }}</span>
          </div>
          <div class="summary-item" v-if="selectedHall">
            <span>Hall:</span>
            <span>{{ getHallName(selectedHall) }}</span>
          </div>
          <div class="summary-item" v-if="selectedDate">
            <span>Date:</span>
            <span>{{ selectedDate }}</span>
          </div>
          <div class="summary-item" v-if="selectedSession && getSelectedSessionDetails()">
            <span>Time:</span>
            <span>{{ formatSessionTime(getSelectedSessionDetails()) }}</span>
          </div>
          <div class="summary-item" v-if="selectedSeats.length > 0">
            <span>Seats:</span>
            <span>{{ selectedSeats.length }} selected</span>
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
      paymentInfo: {
        name: '',
        email: '',
        phone: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
      },
      loading: false,
      error: null
    }
  },
  computed: {
    ticketPrice() {
      if (this.selectedSession && this.selectedSession.price) {
        return this.selectedSession.price.standard || 0
      }
      return 9.50
    },
    total() {
      return (this.selectedSeats.length * this.ticketPrice).toFixed(2)
    },
    canProceedToStep2() {
      return this.selectedFilm && this.selectedCinema && this.selectedHall && this.selectedSession && this.selectedDate
    },
    filteredSessions() {
      if (!this.sessions.length) return []
      
      return this.sessions.filter(session => {
        const matchesFilm = !this.selectedFilm || session.film._id === this.selectedFilm
        const matchesCinema = !this.selectedCinema || 
          (session.hall && session.hall.cinema && session.hall.cinema._id === this.selectedCinema)
        const matchesHall = !this.selectedHall || 
          (session.hall && session.hall._id === this.selectedHall)
        
        return matchesFilm && matchesCinema && matchesHall
      })
    }
  },
  async mounted() {
    await this.loadFilms()
    await this.loadCinemas()
    await this.applyPrefillFromQuery()
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
        this.cinemas = response.data.data || []
      } catch (error) {
        console.error('Error loading cinemas:', error)
        this.error = 'Failed to load cinemas'
      } finally {
        this.loading = false
      }
    },
    async applyPrefillFromQuery() {
      const { film, cinema, cinemaId, date, time } = this.$route.query
      const filmName = Array.isArray(film) ? film[0] : film
      const cinemaName = Array.isArray(cinema) ? cinema[0] : cinema
      const cinemaKey = Array.isArray(cinemaId) ? cinemaId[0] : cinemaId
      const dateValue = Array.isArray(date) ? date[0] : date
      const timeValue = Array.isArray(time) ? time[0] : time

      if (dateValue) {
        this.selectedDate = dateValue
      }

      if (filmName) {
        const filmMatch = this.films.find(item => item.title?.toLowerCase() === filmName.toLowerCase())
        if (filmMatch) {
          this.selectedFilm = filmMatch._id
        }
      }

      if (cinemaKey) {
        const cinemaMatch = this.cinemas.find(item => item._id === cinemaKey)
        if (cinemaMatch) {
          this.selectedCinema = cinemaMatch._id
        }
      }

      if (!this.selectedCinema && cinemaName) {
        const cinemaMatch = this.cinemas.find(item => item.name?.toLowerCase() === cinemaName.toLowerCase())
        if (cinemaMatch) {
          this.selectedCinema = cinemaMatch._id
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
        const sessionMatch = sessionsToSearch.find(
          session => this.formatSessionTime(session) === normalizedTime
        )

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
      } catch (error) {
        console.error('Error loading seat layout:', error)
        this.error = 'Failed to load seat layout'
      } finally {
        this.loading = false
      }
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
        if (!this.canProceedToStep2) {
          alert('Please select a film, cinema, hall, and session to continue')
          return
        }
        await this.loadSeatLayout()
      } else if (this.currentStep === 2) {
        if (this.selectedSeats.length === 0) {
          alert('Please select at least one seat')
          return
        }
      }
      
      if (this.currentStep < 3) {
        this.currentStep++
      }
    },
    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },
    isSelected(row, seat) {
      return this.selectedSeats.some(s => s.row === row && s.number === seat)
    },
    isOccupied(row, seat) {
      return this.occupiedSeats.some(s => s[0] === row && s[1] === seat)
    },
    toggleSeat(row, seat) {
      const index = this.selectedSeats.findIndex(s => s.row === row && s.number === seat)
      if (index > -1) {
        this.selectedSeats.splice(index, 1)
      } else {
        this.selectedSeats.push({ row, number: seat })
      }
    },
    async confirmBooking() {
      if (!this.paymentInfo.email || !this.paymentInfo.name) {
        alert('Please fill in your contact information')
        return
      }
      
      try {
        this.loading = true
        const bookingData = {
          sessionId: this.selectedSession,
          seats: this.selectedSeats,
          contactEmail: this.paymentInfo.email,
          contactPhone: this.paymentInfo.phone,
          paymentMethod: 'card'
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
      const cinema = this.cinemas.find(c => c._id === cinemaId)
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
  background: #ffffff;
  color: var(--color-text);
}

.page-header {
  background: linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)),
    linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
  padding: 3rem 0;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  color: var(--color-text);
  margin-bottom: 0.5rem;
  text-shadow: none;
}

.page-header .subtitle {
  color: var(--color-text-muted);
  font-size: 1.1rem;
}

.booking {
  padding: 2.5rem 0 3rem;
  color: var(--color-text);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.error-message {
  background: rgba(244, 67, 54, 0.12);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.loading-message {
  background: rgba(249, 115, 22, 0.12);
  color: var(--color-text);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid rgba(249, 115, 22, 0.3);
  text-align: center;
}

.info-text {
  color: var(--color-text-muted);
  font-style: italic;
  margin-top: 0.5rem;
}

.booking-steps {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
  background: var(--color-surface);
  padding: 1.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
}

.step.active {
  color: var(--color-primary);
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: var(--color-text);
}

.step.active .step-number {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
}

.booking-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.main-content {
  background: var(--color-surface);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid var(--color-border);
}

.step-content h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: var(--color-text);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  font-size: 1rem;
  background: var(--color-surface-muted);
  color: var(--color-text);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
}

.form-group input::placeholder {
  color: var(--color-text-muted);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.screen {
  background: var(--color-surface-muted);
  color: var(--color-text);
  text-align: center;
  padding: 1rem;
  margin-bottom: 2rem;
  border-radius: 10px;
  font-weight: bold;
  border: 1px solid var(--color-border);
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
  color: var(--color-text-muted);
}

.seat {
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  color: var(--color-text);
}

.seat:hover:not(:disabled) {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.seat.selected {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.seat.occupied {
  background: var(--color-border);
  border-color: var(--color-border);
  cursor: not-allowed;
  color: var(--color-text-muted);
}

.legend {
  display: flex;
  gap: 2rem;
  justify-content: center;
  color: var(--color-text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.seat-example {
  width: 30px;
  height: 30px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
}

.seat-example.available {
  background: var(--color-surface);
}

.seat-example.selected {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.seat-example.occupied {
  background: var(--color-border);
  border-color: var(--color-border);
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
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.35);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(249, 115, 22, 0.5);
}

.btn-secondary {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-surface);
}

.booking-summary {
  background: var(--color-surface);
  padding: 2rem;
  border-radius: 16px;
  height: fit-content;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid var(--color-border);
}

.booking-summary h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--color-text);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: var(--color-text-muted);
}

.summary-divider {
  border-top: 2px solid var(--color-border);
  margin: 1rem 0;
}

.summary-item.total {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--color-text);
}

@media (max-width: 968px) {
  .booking-content {
    grid-template-columns: 1fr;
  }
}
</style>
