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

      <div class="booking-content">
        <div class="main-content">
          <div v-if="currentStep === 1" class="step-content">
            <h2>Select Movie & Time</h2>
            <div class="movie-selection">
              <div class="form-group">
                <label>Movie:</label>
                <select v-model="selectedMovie">
                  <option value="">Choose a movie</option>
                  <option v-for="i in 5" :key="i" :value="i">Movie Title {{ i }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Date:</label>
                <input type="date" v-model="selectedDate">
              </div>
              <div class="form-group">
                <label>Time:</label>
                <select v-model="selectedTime">
                  <option value="">Choose a time</option>
                  <option v-for="time in ['10:00', '13:30', '16:45', '19:00', '21:30']" :key="time" :value="time">
                    {{ time }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Cinema:</label>
                <select v-model="selectedCinema">
                  <option value="">Choose a cinema</option>
                  <option v-for="i in 3" :key="i" :value="i">Cinema {{ i }}</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="currentStep === 2" class="step-content">
            <h2>Select Your Seats</h2>
            <div class="screen">SCREEN</div>
            <div class="seating-chart">
              <div class="row" v-for="row in 8" :key="row">
                <span class="row-label">{{ String.fromCharCode(64 + row) }}</span>
                <button 
                  v-for="seat in 12" 
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

          <div v-if="currentStep === 3" class="step-content">
            <h2>Payment Details</h2>
            <form class="payment-form">
              <div class="form-group">
                <label>Full Name:</label>
                <input type="text" v-model="paymentInfo.name" placeholder="John Doe">
              </div>
              <div class="form-group">
                <label>Email:</label>
                <input type="email" v-model="paymentInfo.email" placeholder="john@example.com">
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
            <button v-if="currentStep > 1" @click="previousStep" class="btn btn-secondary">
              Previous
            </button>
            <button v-if="currentStep < 3" @click="nextStep" class="btn btn-primary">
              Next
            </button>
            <button v-if="currentStep === 3" @click="confirmBooking" class="btn btn-primary">
              Confirm Booking
            </button>
          </div>
        </div>

        <div class="booking-summary">
          <h3>Booking Summary</h3>
          <div class="summary-item" v-if="selectedMovie">
            <span>Movie:</span>
            <span>Movie Title {{ selectedMovie }}</span>
          </div>
          <div class="summary-item" v-if="selectedDate">
            <span>Date:</span>
            <span>{{ selectedDate }}</span>
          </div>
          <div class="summary-item" v-if="selectedTime">
            <span>Time:</span>
            <span>{{ selectedTime }}</span>
          </div>
          <div class="summary-item" v-if="selectedCinema">
            <span>Cinema:</span>
            <span>Cinema {{ selectedCinema }}</span>
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
</template>

<script>
export default {
  name: 'Booking',
  data() {
    return {
      currentStep: 1,
      selectedMovie: '',
      selectedDate: '',
      selectedTime: '',
      selectedCinema: '',
      selectedSeats: [],
      occupiedSeats: [[2, 3], [2, 4], [5, 6], [5, 7]],
      paymentInfo: {
        name: '',
        email: '',
        phone: '',
        cardNumber: '',
        expiry: '',
        cvv: ''
      },
      ticketPrice: 9.50
    }
  },
  computed: {
    total() {
      return (this.selectedSeats.length * this.ticketPrice).toFixed(2)
    }
  },
  methods: {
    nextStep() {
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
      return this.selectedSeats.some(s => s[0] === row && s[1] === seat)
    },
    isOccupied(row, seat) {
      return this.occupiedSeats.some(s => s[0] === row && s[1] === seat)
    },
    toggleSeat(row, seat) {
      const index = this.selectedSeats.findIndex(s => s[0] === row && s[1] === seat)
      if (index > -1) {
        this.selectedSeats.splice(index, 1)
      } else {
        this.selectedSeats.push([row, seat])
      }
    },
    confirmBooking() {
      alert('Booking confirmed! Thank you for your purchase.')
      this.$router.push('/')
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

@media (max-width: 968px) {
  .booking-content {
    grid-template-columns: 1fr;
  }
}
</style>
