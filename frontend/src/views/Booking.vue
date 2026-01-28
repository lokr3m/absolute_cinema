<template>
  <div class="booking">
    <div class="container">
      <h1>Book Your Tickets</h1>
      
      <div class="booking-steps">
        <div class="step" :class="{ active: currentStep === 1 }">
          <span class="step-number">1</span>
          <span class="step-label">Select Movie</span>
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

      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="booking-content">
        <div class="main-content">
          <div v-if="currentStep === 1" class="step-content">
            <h2>Select Movie & Time</h2>
            
            <!-- Film not found message -->
            <div v-if="filmNotFoundMessage" class="info-message">
              {{ filmNotFoundMessage }}
            </div>
            
            <div class="movie-selection">
              <div class="form-group">
                <label>Movie:</label>
                <select v-model="selectedFilmId" @change="onFilmChange">
                  <option value="">Choose a movie</option>
                  <option v-for="film in films" :key="film._id" :value="film._id">
                    {{ film.title }}
                  </option>
                </select>
              </div>
              <div class="form-group" v-if="sessions.length > 0">
                <label>Session:</label>
                <select v-model="selectedSessionId" @change="onSessionChange">
                  <option value="">Choose a session</option>
                  <option v-for="session in sessions" :key="session._id" :value="session._id">
                    {{ formatDateTime(session.startTime) }} - {{ session.hall.name }} ({{ session.hall.cinema.name }})
                  </option>
                </select>
              </div>
              <div v-else-if="selectedFilmId" class="no-sessions">
                No sessions available for this film
              </div>
            </div>
          </div>

          <div v-if="currentStep === 2" class="step-content">
            <h2>Select Your Seats</h2>
            <div class="screen">SCREEN</div>
            <div v-if="loadingSeats" class="loading">Loading seats...</div>
            <div v-else class="seating-chart">
              <div class="row" v-for="row in uniqueRows" :key="row">
                <span class="row-label">{{ row }}</span>
                <button 
                  v-for="seat in getSeatsInRow(row)" 
                  :key="seat._id"
                  class="seat"
                  :class="{ 
                    selected: isSelected(seat._id),
                    occupied: !seat.isAvailable,
                    vip: seat.seatType === 'vip'
                  }"
                  @click="toggleSeat(seat)"
                  :disabled="!seat.isAvailable"
                >
                  {{ seat.number }}
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

          <div v-if="currentStep === 3" class="step-content">
            <h2>Payment Details</h2>
            <form class="payment-form" @submit.prevent="confirmBooking">
              <div class="form-group">
                <label>Full Name:</label>
                <input type="text" v-model="paymentInfo.name" placeholder="John Doe" required>
              </div>
              <div class="form-group">
                <label>Email:</label>
                <input type="email" v-model="paymentInfo.email" placeholder="john@example.com" required>
              </div>
              <div class="form-group">
                <label>Phone:</label>
                <input type="tel" v-model="paymentInfo.phone" placeholder="+372 1234 5678">
              </div>
              <div class="form-group">
                <label>Card Number:</label>
                <input type="text" v-model="paymentInfo.cardNumber" placeholder="1234 5678 9012 3456" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Expiry Date:</label>
                  <input type="text" v-model="paymentInfo.expiry" placeholder="MM/YY" required>
                </div>
                <div class="form-group">
                  <label>CVV:</label>
                  <input type="text" v-model="paymentInfo.cvv" placeholder="123" required>
                </div>
              </div>
            </form>
          </div>

          <div class="navigation-buttons">
            <button v-if="currentStep > 1" @click="previousStep" class="btn btn-secondary">
              Previous
            </button>
            <button 
              v-if="currentStep < 3" 
              @click="nextStep" 
              class="btn btn-primary"
              :disabled="!canProceed"
            >
              Next
            </button>
            <button 
              v-if="currentStep === 3" 
              @click="confirmBooking" 
              class="btn btn-primary"
              :disabled="submitting"
            >
              {{ submitting ? 'Processing...' : 'Confirm Booking' }}
            </button>
          </div>
        </div>

        <div class="booking-summary">
          <h3>Booking Summary</h3>
          <div class="summary-item" v-if="selectedFilm">
            <span>Movie:</span>
            <span>{{ selectedFilm.title }}</span>
          </div>
          <div class="summary-item" v-if="selectedSession">
            <span>Date & Time:</span>
            <span>{{ formatDateTime(selectedSession.startTime) }}</span>
          </div>
          <div class="summary-item" v-if="selectedSession">
            <span>Cinema:</span>
            <span>{{ selectedSession.hall.cinema.name }}</span>
          </div>
          <div class="summary-item" v-if="selectedSession">
            <span>Hall:</span>
            <span>{{ selectedSession.hall.name }}</span>
          </div>
          <div class="summary-item" v-if="selectedSeats.length > 0">
            <span>Seats:</span>
            <span>{{ selectedSeats.length }} selected ({{ formatSeatNumbers() }})</span>
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
</template>

<script>
import axios from 'axios'

export default {
  name: 'Booking',
  props: {
    filmId: String,
    sessionId: String,
    filmTitle: String
  },
  data() {
    return {
      currentStep: 1,
      films: [],
      sessions: [],
      seats: [],
      selectedFilmId: this.filmId || '',
      selectedSessionId: this.sessionId || '',
      selectedFilm: null,
      selectedSession: null,
      selectedSeats: [],
      paymentInfo: {
        name: '',
        email: '',
        phone: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
      },
      loading: true,
      loadingSeats: false,
      error: null,
      submitting: false,
      filmNotFoundMessage: null
    }
  },
  computed: {
    apiUrl() {
      return import.meta.env.VITE_API_URL || 'http://localhost:3000'
    },
    uniqueRows() {
      const rows = [...new Set(this.seats.map(s => s.row))].sort((a, b) => a - b)
      return rows
    },
    total() {
      if (!this.selectedSession || this.selectedSeats.length === 0) return '0.00'
      
      let total = 0
      this.selectedSeats.forEach(seat => {
        const seatData = this.seats.find(s => s._id === seat)
        if (seatData && seatData.seatType === 'vip' && this.selectedSession.price.vip) {
          total += this.selectedSession.price.vip
        } else if (this.selectedSession.price.standard) {
          total += this.selectedSession.price.standard
        }
      })
      return total.toFixed(2)
    },
    canProceed() {
      if (this.currentStep === 1) {
        return this.selectedSessionId !== ''
      }
      if (this.currentStep === 2) {
        return this.selectedSeats.length > 0
      }
      return true
    }
  },
  async mounted() {
    await this.loadFilms()
    
    // Priority: filmId > filmTitle
    // If filmId is provided, use it directly
    if (this.filmId) {
      this.selectedFilmId = this.filmId
      await this.loadSessions()
    }
    // If filmTitle is provided (from Schedule page), find matching film
    else if (this.filmTitle) {
      const matchingFilm = this.films.find(film => 
        film.title?.toLowerCase() === this.filmTitle.toLowerCase() ||
        film.originalTitle?.toLowerCase() === this.filmTitle.toLowerCase()
      )
      
      if (matchingFilm) {
        this.selectedFilmId = matchingFilm._id
        await this.loadSessions()
      } else {
        // Film not found in database
        this.filmNotFoundMessage = `Film "${this.filmTitle}" is not currently available for booking. Please select from available films below.`
      }
    }
    
    // If sessionId is provided, select it and load seats
    if (this.sessionId) {
      this.selectedSessionId = this.sessionId
      await this.loadSessionDetails()
      await this.loadSeats()
      
      // If we have both film and session, move to seat selection
      if (this.selectedFilm && this.selectedSession) {
        this.currentStep = 2
      }
    }
    
    this.loading = false
  },
  methods: {
    async loadFilms() {
      try {
        const response = await axios.get(`${this.apiUrl}/api/films`)
        this.films = response.data.data || []
      } catch (err) {
        console.error('Error loading films:', err)
        this.error = 'Failed to load films'
      }
    },
    async loadSessions() {
      if (!this.selectedFilmId) return
      
      try {
        const response = await axios.get(`${this.apiUrl}/api/films/${this.selectedFilmId}/sessions`)
        this.sessions = response.data.data || []
        this.selectedFilm = response.data.film
      } catch (err) {
        console.error('Error loading sessions:', err)
        this.error = 'Failed to load sessions'
      }
    },
    async loadSessionDetails() {
      if (!this.selectedSessionId) return
      
      try {
        const response = await axios.get(`${this.apiUrl}/api/sessions`, {
          params: { filmId: this.selectedFilmId }
        })
        const allSessions = response.data.data || []
        this.selectedSession = allSessions.find(s => s._id === this.selectedSessionId)
        
        if (this.selectedSession) {
          this.selectedFilm = this.selectedSession.film
        }
      } catch (err) {
        console.error('Error loading session details:', err)
      }
    },
    async loadSeats() {
      if (!this.selectedSessionId) return
      
      this.loadingSeats = true
      try {
        const response = await axios.get(`${this.apiUrl}/api/sessions/${this.selectedSessionId}/seats`)
        this.seats = response.data.data || []
      } catch (err) {
        console.error('Error loading seats:', err)
        this.error = 'Failed to load seats'
      } finally {
        this.loadingSeats = false
      }
    },
    async onFilmChange() {
      // Clear film not found message when user manually selects a film
      this.filmNotFoundMessage = null
      
      this.selectedSessionId = ''
      this.selectedSession = null
      this.sessions = []
      this.selectedSeats = []
      this.seats = []
      
      if (this.selectedFilmId) {
        await this.loadSessions()
      }
    },
    async onSessionChange() {
      this.selectedSeats = []
      this.seats = []
      
      if (this.selectedSessionId) {
        this.selectedSession = this.sessions.find(s => s._id === this.selectedSessionId)
        await this.loadSeats()
      }
    },
    getSeatsInRow(row) {
      return this.seats.filter(s => s.row === row).sort((a, b) => a.number - b.number)
    },
    isSelected(seatId) {
      return this.selectedSeats.includes(seatId)
    },
    toggleSeat(seat) {
      if (!seat.isAvailable) return
      
      const index = this.selectedSeats.indexOf(seat._id)
      if (index > -1) {
        this.selectedSeats.splice(index, 1)
      } else {
        this.selectedSeats.push(seat._id)
      }
    },
    nextStep() {
      if (!this.canProceed) return
      
      if (this.currentStep < 3) {
        this.currentStep++
      }
    },
    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },
    formatDateTime(dateTime) {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    formatSeatNumbers() {
      const seatNumbers = this.selectedSeats.map(seatId => {
        const seat = this.seats.find(s => s._id === seatId)
        return seat ? `Row ${seat.row} Seat ${seat.number}` : ''
      }).filter(s => s)
      return seatNumbers.join(', ')
    },
    async confirmBooking() {
      if (this.submitting) return
      
      this.submitting = true
      try {
        const bookingData = {
          sessionId: this.selectedSessionId,
          seatIds: this.selectedSeats,
          contactEmail: this.paymentInfo.email,
          contactPhone: this.paymentInfo.phone
        }
        
        const response = await axios.post(`${this.apiUrl}/api/bookings`, bookingData)
        
        if (response.data.success) {
          const booking = response.data.data
          alert(`Booking confirmed! Your booking number is: ${booking.bookingNumber}`)
          this.$router.push('/')
        }
      } catch (err) {
        console.error('Error confirming booking:', err)
        const errorMsg = err.response?.data?.error || 'Failed to confirm booking'
        alert(`Error: ${errorMsg}`)
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.booking {
  padding: 3rem 0;
  min-height: calc(100vh - 200px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #333;
}

.booking-steps {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #999;
}

.step.active {
  color: #e50914;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.step.active .step-number {
  background: #e50914;
  color: #fff;
}

.booking-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
}

.main-content {
  background: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
}

.step-content h2 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.screen {
  background: #333;
  color: #fff;
  text-align: center;
  padding: 1rem;
  margin-bottom: 2rem;
  border-radius: 4px;
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
  color: #666;
}

.seat {
  width: 40px;
  height: 40px;
  border: 2px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
}

.seat:hover:not(:disabled) {
  background: #e50914;
  color: #fff;
  border-color: #e50914;
}

.seat.selected {
  background: #e50914;
  color: #fff;
  border-color: #e50914;
}

.seat.occupied {
  background: #666;
  border-color: #666;
  cursor: not-allowed;
}

.seat.vip {
  border-color: #f5c518;
  background: #fffacd;
}

.seat.vip.selected {
  background: #f5c518;
  color: #333;
  border-color: #f5c518;
}

.seat.vip:hover:not(:disabled):not(.selected) {
  background: #f5c518;
  color: #333;
  border-color: #f5c518;
}

.legend {
  display: flex;
  gap: 2rem;
  justify-content: center;
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
  border-radius: 4px;
}

.seat-example.available {
  background: #fff;
}

.seat-example.selected {
  background: #e50914;
  border-color: #e50914;
}

.seat-example.occupied {
  background: #666;
  border-color: #666;
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
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #e50914;
  color: #fff;
}

.btn-primary:hover {
  background-color: #c00812;
}

.btn-secondary {
  background-color: #333;
  color: #fff;
}

.btn-secondary:hover {
  background-color: #555;
}

.booking-summary {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  height: fit-content;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.booking-summary h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  color: #666;
}

.summary-divider {
  border-top: 2px solid #ddd;
  margin: 1rem 0;
}

.summary-item.total {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
}

.error {
  padding: 1rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.info-message {
  padding: 1rem;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  border: 1px solid #90caf9;
}

.no-sessions {
  padding: 1rem;
  background: #fff3cd;
  color: #856404;
  border-radius: 4px;
  text-align: center;
}

@media (max-width: 968px) {
  .booking-content {
    grid-template-columns: 1fr;
  }
}
</style>
