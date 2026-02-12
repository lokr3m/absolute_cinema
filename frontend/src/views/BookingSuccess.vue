<template>
  <div class="booking-success-page">
    <div class="page-header">
      <div class="container">
        <h1>✅ Payment Successful</h1>
        <p class="subtitle">Your booking is confirmed. Download your ticket below.</p>
      </div>
    </div>

    <div class="container success-content">
      <div v-if="loading" class="loading-message">Loading your ticket...</div>
      <div v-else-if="error" class="error-message">{{ error }}</div>

      <div v-else-if="booking" class="ticket-wrapper">
        <div class="ticket-card">
          <div v-if="posterUrl" class="ticket-poster">
            <img :src="posterUrl" :alt="filmTitle">
          </div>
          <div class="ticket-details">
            <div class="ticket-header">
              <div>
                <h2>{{ filmTitle }}</h2>
                <p class="ticket-subtitle">{{ cinemaName }} · {{ hallName }}</p>
              </div>
              <span class="ticket-status">{{ paymentStatusLabel }}</span>
            </div>

            <div class="ticket-info">
              <div class="info-row">
                <span>Booking #</span>
                <span>{{ booking.bookingNumber }}</span>
              </div>
              <div class="info-row">
                <span>Date</span>
                <span>{{ formattedDate }}</span>
              </div>
              <div class="info-row">
                <span>Time</span>
                <span>{{ formattedTime }}</span>
              </div>
              <div class="info-row">
                <span>Seats</span>
                <span>{{ seatList }}</span>
              </div>
              <div class="info-row">
                <span>Email</span>
                <span>{{ booking.contactEmail }}</span>
              </div>
              <div class="info-row total">
                <span>Total Paid</span>
                <span>€{{ formattedTotal }}</span>
              </div>
            </div>
          </div>
          <div class="ticket-qr">
            <div class="qr-title">Ticket QR</div>
            <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="Ticket QR code">
            <p>Scan at the entrance.</p>
          </div>
        </div>

        <div class="ticket-actions">
          <button class="btn btn-primary" @click="downloadTicket" :disabled="!qrCodeDataUrl">
            Download Ticket (PDF)
          </button>
          <router-link class="btn btn-secondary" to="/">Back to Home</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'

const API_BASE_URL = 'http://localhost:3000/api'

export default {
  name: 'BookingSuccess',
  data() {
    return {
      booking: null,
      qrCodeDataUrl: '',
      loading: false,
      error: null
    }
  },
  computed: {
    filmTitle() {
      return this.booking?.session?.film?.title || 'Your Film'
    },
    cinemaName() {
      return this.booking?.session?.hall?.cinema?.name || 'Cinema'
    },
    hallName() {
      return this.booking?.session?.hall?.name || 'Hall'
    },
    posterUrl() {
      return this.booking?.session?.film?.posterUrl || ''
    },
    formattedDate() {
      if (!this.booking?.session?.startTime) return ''
      return new Date(this.booking.session.startTime).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    },
    formattedTime() {
      if (!this.booking?.session?.startTime) return ''
      return new Date(this.booking.session.startTime).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    seatList() {
      if (!this.booking?.seats?.length) return '—'
      return this.booking.seats
        .map(seat => `${String.fromCharCode(64 + seat.row)}${seat.number}`)
        .join(', ')
    },
    formattedTotal() {
      return Number(this.booking?.totalPrice || 0).toFixed(2)
    },
    paymentStatusLabel() {
      return this.booking?.paymentStatus === 'paid' ? 'Paid' : 'Pending'
    }
  },
  async mounted() {
    await this.fetchBooking()
  },
  methods: {
    async fetchBooking() {
      const bookingNumber = this.$route.params.bookingNumber
      if (!bookingNumber) {
        this.error = 'Booking number is missing.'
        return
      }

      try {
        this.loading = true
        const response = await axios.get(`${API_BASE_URL}/bookings/${bookingNumber}`)
        this.booking = response.data.data
        await this.generateQrCode()
      } catch (error) {
        console.error('Error loading booking:', error)
        this.error = 'We could not load your booking details.'
      } finally {
        this.loading = false
      }
    },
    buildQrPayload() {
      return {
        bookingNumber: this.booking?.bookingNumber,
        film: this.filmTitle,
        cinema: this.cinemaName,
        hall: this.hallName,
        startTime: this.booking?.session?.startTime,
        seats: this.seatList,
        email: this.booking?.contactEmail
      }
    },
    async generateQrCode() {
      if (!this.booking) return
      const payload = JSON.stringify(this.buildQrPayload())
      this.qrCodeDataUrl = await QRCode.toDataURL(payload, { width: 220, margin: 2 })
    },
    downloadTicket() {
      if (!this.booking || !this.qrCodeDataUrl) return

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text('Absolute Cinema Ticket', 40, 50)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(`Booking: ${this.booking.bookingNumber}`, 40, 90)
      doc.text(`Film: ${this.filmTitle}`, 40, 110)
      doc.text(`Cinema: ${this.cinemaName}`, 40, 130)
      doc.text(`Hall: ${this.hallName}`, 40, 150)
      doc.text(`Date: ${this.formattedDate}`, 40, 170)
      doc.text(`Time: ${this.formattedTime}`, 40, 190)
      doc.text(`Seats: ${this.seatList}`, 40, 210)
      doc.text(`Email: ${this.booking.contactEmail}`, 40, 230)
      doc.text(`Total Paid: €${this.formattedTotal}`, 40, 250)

      doc.addImage(this.qrCodeDataUrl, 'PNG', 360, 90, 160, 160)
      doc.setFontSize(10)
      doc.text('Scan for entry', 400, 270)

      doc.save(`ticket-${this.booking.bookingNumber}.pdf`)
    }
  }
}
</script>

<style scoped>
.booking-success-page {
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
    url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 0h2v20H9V0zm25.134.84l1.732 1-10 17.32-1.732-1 10-17.32zm-20 20l1.732 1-10 17.32-1.732-1 10-17.32zM58.16 4.134l1 1.732-17.32 10-1-1.732 17.32-10zm-40 40l1 1.732-17.32 10-1-1.732 17.32-10zM80 9v2H60V9h20zM20 69v2H0v-2h20zm79.32-55l-1 1.732-17.32-10L82 4l17.32 10zm-80 80l-1 1.732-17.32-10L2 84l17.32 10zm96.546-75.84l-1.732 1-10-17.32 1.732-1 10 17.32zm-100 100l-1.732 1-10-17.32 1.732-1 10 17.32zM38.16 24.134l1 1.732-17.32 10-1-1.732 17.32-10zM60 29v2H40v-2h20zm19.32 5l-1 1.732-17.32-10L62 24l17.32 10zm16.546 4.16l-1.732 1-10-17.32 1.732-1 10 17.32zM111 40h-2V20h2v20zm3.134.84l1.732 1-10 17.32-1.732-1 10-17.32zM40 49v2H20v-2h20zm19.32 5l-1 1.732-17.32-10L42 44l17.32 10zm16.546 4.16l-1.732 1-10-17.32 1.732-1 10 17.32zM91 60h-2V40h2v20zm3.134.84l1.732 1-10 17.32-1.732-1 10-17.32zm24.026 3.294l1 1.732-17.32 10-1-1.732 17.32-10zM39.32 74l-1 1.732-17.32-10L22 64l17.32 10zm16.546 4.16l-1.732 1-10-17.32 1.732-1 10 17.32zM71 80h-2V60h2v20zm3.134.84l1.732 1-10 17.32-1.732-1 10 17.32zm24.026 3.294l1 1.732-17.32 10-1-1.732 17.32-10zM120 89v2h-20v-2h20zm-84.134 9.16l-1.732 1-10-17.32 1.732-1 10 17.32zM51 100h-2V80h2v20zm3.134.84l1.732 1-10 17.32-1.732-1 10 17.32zm24.026 3.294l1 1.732-17.32 10-1-1.732 17.32-10zM100 109v2H80v-2h20zm19.32 5l-1 1.732-17.32-10 1-1.732 17.32 10zM31 120h-2v-20h2v20z' fill='%23ffffff' fill-opacity='0.025' fill-rule='evenodd'/%3E%3C/svg%3E");
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

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.success-content {
  padding: 2.5rem 0 3rem;
}

.loading-message,
.error-message {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #e8e8e8;
  text-align: center;
  margin-bottom: 1rem;
}

.error-message {
  border-color: #ffd0c2;
  color: #e65c00;
  background: #fff3ec;
}

.ticket-wrapper {
  display: grid;
  gap: 2rem;
}

.ticket-card {
  display: grid;
  grid-template-columns: 150px 1fr 180px;
  gap: 2rem;
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid #e8e8e8;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
  align-items: center;
}

.ticket-poster img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.ticket-header h2 {
  margin: 0 0 0.35rem;
  font-size: 1.8rem;
  color: #2c3e50;
}

.ticket-subtitle {
  color: #7f8c8d;
  margin: 0;
}

.ticket-status {
  background: #2ecc71;
  color: #fff;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ticket-info {
  margin-top: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  color: #2c3e50;
}

.info-row span:last-child {
  font-weight: 600;
}

.info-row.total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #e8e8e8;
  font-size: 1.1rem;
}

.ticket-qr {
  text-align: center;
}

.ticket-qr img {
  width: 140px;
  height: 140px;
  margin-bottom: 0.75rem;
}

.qr-title {
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.ticket-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 1024px) {
  .ticket-card {
    grid-template-columns: 140px 1fr;
  }

  .ticket-qr {
    grid-column: 1 / -1;
    text-align: left;
  }
}

@media (max-width: 768px) {
  .ticket-card {
    grid-template-columns: 1fr;
  }

  .ticket-actions {
    flex-direction: column;
  }
}
</style>
