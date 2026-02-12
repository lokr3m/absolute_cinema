<template>
  <div class="admin-page">
    <div class="page-header">
      <div class="container">
        <h1>⚙️ Admin Dashboard</h1>
        <p class="subtitle">Manage movies, sessions, bookings, and cinemas</p>
      </div>
    </div>
    <div class="admin">
      <div class="container">
      
      <div class="admin-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="admin-content">
        <!-- Movies Management -->
        <div v-if="activeTab === 'movies'" class="tab-content">
          <div class="section-header">
            <h2>Manage Movies</h2>
            <button class="btn btn-primary" disabled>Add New Movie</button>
          </div>
          <div v-if="loading" class="loading">Loading movies...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Genre</th>
                <th>Duration</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="film in films" :key="film._id">
                <td>{{ film.title }}</td>
                <td>{{ film.genre.join(', ') }}</td>
                <td>{{ film.duration }} min</td>
                <td>{{ film.isActive ? '✅' : '❌' }}</td>
              </tr>
              <tr v-if="films.length === 0">
                <td colspan="4" style="text-align: center;">No films found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sessions Management -->
        <div v-if="activeTab === 'sessions'" class="tab-content">
          <div class="section-header">
            <h2>Manage Sessions</h2>
            <button class="btn btn-primary" @click="showSessionForm = true">Add New Session</button>
          </div>
          <div class="info-message">
            ℹ️ Halls and cinemas for sessions are loaded from Apollo Kino API. 
            <span v-if="halls.length === 0" style="color: #dc3545;">
              <strong>No halls found.</strong> Please go to the "Cinemas" tab and sync data from Apollo Kino API.
            </span>
            <span v-else style="color: #28a745;">
              <strong>{{ halls.length }} halls available</strong> from Apollo Kino cinemas.
            </span>
          </div>
          <div v-if="loading" class="loading">Loading sessions...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Hall</th>
                <th>Cinema</th>
                <th>Date & Time</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="session in sessions" :key="session._id">
                <td>{{ session.film ? session.film.title : 'N/A' }}</td>
                <td>{{ session.hall ? session.hall.name : 'N/A' }}</td>
                <td>{{ session.hall && session.hall.cinema ? session.hall.cinema.name : 'N/A' }}</td>
                <td>{{ formatDateTime(session.startTime) }}</td>
                <td>€{{ session.price.standard.toFixed(2) }}</td>
                <td>
                  <span class="status-badge" :class="session.status">
                    {{ session.status }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-icon edit" @click="editSession(session)" title="Edit">✏️</button>
                  <button class="btn-icon delete" @click="deleteSession(session._id)" title="Delete">🗑️</button>
                </td>
              </tr>
              <tr v-if="sessions.length === 0">
                <td colspan="7" style="text-align: center;">No sessions found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bookings Management -->
        <div v-if="activeTab === 'bookings'" class="tab-content">
          <div class="section-header">
            <h2>Manage Bookings</h2>
          </div>
          <div v-if="loading" class="loading">Loading bookings...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Booking #</th>
                <th>Customer</th>
                <th>Movie</th>
                <th>Date</th>
                <th>Seats</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="booking in bookings" :key="booking._id">
                <td>{{ booking.bookingNumber }}</td>
                <td>{{ booking.contactEmail }}</td>
                <td>{{ booking.session && booking.session.film ? booking.session.film.title : 'N/A' }}</td>
                <td>{{ booking.session ? formatDateTime(booking.session.startTime) : 'N/A' }}</td>
                <td>{{ booking.seats.length }} seat(s)</td>
                <td>€{{ booking.totalPrice.toFixed(2) }}</td>
                <td>
                  <span class="status-badge" :class="booking.status">
                    {{ booking.status }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-icon delete" @click="deleteBooking(booking._id)" title="Delete">🗑️</button>
                </td>
              </tr>
              <tr v-if="bookings.length === 0">
                <td colspan="8" style="text-align: center;">No bookings found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cinemas Management -->
        <div v-if="activeTab === 'cinemas'" class="tab-content">
          <div class="section-header">
            <h2>Manage Cinemas</h2>
            <button class="btn btn-success" @click="syncCinemasFromApollo" :disabled="syncing">
              {{ syncing ? 'Syncing...' : '🔄 Sync from Apollo Kino API' }}
            </button>
          </div>
          <div v-if="syncMessage" class="success-message">{{ syncMessage }}</div>
          <div v-if="loading" class="loading">Loading cinemas...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>City</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cinema in cinemas" :key="cinema._id">
                <td>{{ cinema.name }}</td>
                <td>{{ cinema.address.city }}</td>
              </tr>
              <tr v-if="cinemas.length === 0">
                <td colspan="2" style="text-align: center;">No cinemas found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Session Form Modal -->
    <div v-if="showSessionForm" class="modal-overlay" @click.self="closeSessionForm">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingSession ? 'Edit Session' : 'Add New Session' }}</h2>
          <button class="close-btn" @click="closeSessionForm">✕</button>
        </div>
        <form @submit.prevent="saveSession" class="modal-body">
          <div v-if="halls.length === 0" class="sync-warning">
            <p>⚠️ No halls available in the database.</p>
            <p>Halls and cinemas must be synced from Apollo Kino API before creating sessions.</p>
            <button type="button" class="btn btn-success" @click="syncCinemasFromSessionForm" :disabled="syncing">
              {{ syncing ? 'Syncing...' : '🔄 Sync from Apollo Kino API' }}
            </button>
          </div>
          
          <div class="form-group">
            <label for="film">Film *</label>
            <select v-model="sessionForm.film" id="film" required>
              <option value="">Select a film</option>
              <option v-for="film in films" :key="film._id" :value="film._id">
                {{ film.title }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="hall">Hall *</label>
            <select v-model="sessionForm.hall" id="hall" required :disabled="halls.length === 0">
              <option value="">Select a hall</option>
              <option v-for="hall in halls" :key="hall._id" :value="hall._id">
                {{ hall.cinema ? hall.cinema.name : 'N/A' }} - {{ hall.name }} ({{ hall.capacity }} seats)
              </option>
            </select>
            <div v-if="halls.length === 0" class="form-help-text">
              ⚠️ No halls available. Please sync cinemas and halls from Apollo Kino API using the button above.
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startTime">Start Time *</label>
              <input type="datetime-local" v-model="sessionForm.startTime" id="startTime" required />
            </div>

            <div class="form-group">
              <label for="endTime">End Time *</label>
              <input type="datetime-local" v-model="sessionForm.endTime" id="endTime" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="priceStandard">Standard Price (€) *</label>
              <input type="number" v-model.number="sessionForm.price.standard" id="priceStandard" step="0.01" min="0" required />
            </div>

            <div class="form-group">
              <label for="priceStudent">Student Price (€)</label>
              <input type="number" v-model.number="sessionForm.price.student" id="priceStudent" step="0.01" min="0" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="priceChild">Child Price (€)</label>
              <input type="number" v-model.number="sessionForm.price.child" id="priceChild" step="0.01" min="0" />
            </div>

            <div class="form-group">
              <label for="priceVip">VIP Price (€)</label>
              <input type="number" v-model.number="sessionForm.price.vip" id="priceVip" step="0.01" min="0" />
            </div>
          </div>

          <div class="form-group">
            <label for="subtitles">Subtitles</label>
            <input type="text" v-model="sessionForm.subtitles" id="subtitles" placeholder="e.g., Estonian, Russian" />
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="sessionForm.is3D" />
              3D Session
            </label>
          </div>

          <div class="form-group">
            <label for="status">Status *</label>
            <select v-model="sessionForm.status" id="status" required>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div v-if="formError" :class="formError.startsWith('✅') ? 'form-success' : 'error'">{{ formError }}</div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeSessionForm">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="formSubmitting">
              {{ formSubmitting ? 'Saving...' : 'Save Session' }}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  </div>
</template>

<script>
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default {
  name: 'Admin',
  data() {
    return {
      activeTab: 'sessions',
      tabs: [
        { id: 'movies', label: 'Movies' },
        { id: 'sessions', label: 'Sessions' },
        { id: 'bookings', label: 'Bookings' },
        { id: 'cinemas', label: 'Cinemas' }
      ],
      loading: false,
      error: null,
      films: [],
      sessions: [],
      bookings: [],
      cinemas: [],
      halls: [],
      showSessionForm: false,
      editingSession: null,
      sessionForm: {
        film: '',
        hall: '',
        startTime: '',
        endTime: '',
        price: {
          standard: 0,
          student: 0,
          child: 0,
          vip: 0
        },
        is3D: false,
        subtitles: '',
        status: 'scheduled'
      },
      formError: null,
      formSubmitting: false,
      syncing: false,
      syncMessage: null
    }
  },
  watch: {
    activeTab(newTab) {
      this.loadTabData(newTab);
    }
  },
  mounted() {
    this.loadTabData(this.activeTab);
  },
  methods: {
    async loadTabData(tab) {
      this.loading = true;
      this.error = null;
      
      try {
        switch(tab) {
          case 'movies':
            await this.loadFilms();
            break;
          case 'sessions':
            await this.loadSessions();
            await this.loadFilms();
            await this.loadHalls();
            break;
          case 'bookings':
            await this.loadBookings();
            break;
          case 'cinemas':
            await this.loadCinemas();
            break;
        }
      } catch (err) {
        this.error = err.message || 'Failed to load data';
        console.error('Error loading tab data:', err);
      } finally {
        this.loading = false;
      }
    },

    async loadFilms() {
      const response = await fetch(`${API_BASE_URL}/api/films`);
      const data = await response.json();
      if (data.success) {
        this.films = data.data;
      } else {
        throw new Error(data.error || 'Failed to load films');
      }
    },

    async loadSessions() {
      const response = await fetch(`${API_BASE_URL}/api/admin/sessions`);
      const data = await response.json();
      if (data.success) {
        this.sessions = data.data;
      } else {
        throw new Error(data.error || 'Failed to load sessions');
      }
    },

    async loadBookings() {
      const response = await fetch(`${API_BASE_URL}/api/admin/bookings`);
      const data = await response.json();
      if (data.success) {
        this.bookings = data.data;
      } else {
        throw new Error(data.error || 'Failed to load bookings');
      }
    },

    async loadCinemas() {
      const response = await fetch(`${API_BASE_URL}/api/cinemas`);
      const data = await response.json();
      if (data.success) {
        this.cinemas = (data.data || []).map(cinema => {
          const cinemaId = cinema._id ?? cinema.ID ?? cinema.apolloId ?? cinema.id;
          return {
            _id: cinemaId ? String(cinemaId) : '',
            name: cinema.name ?? cinema.Name ?? cinema.TheatreName ?? 'Unknown Cinema',
            address: cinema.address ?? {
              city: cinema.City ?? cinema.city ?? 'Unknown'
            }
          };
        });
      } else {
        throw new Error(data.error || 'Failed to load cinemas');
      }
    },

    async loadHalls() {
      const response = await fetch(`${API_BASE_URL}/api/admin/halls`);
      const data = await response.json();
      if (data.success) {
        this.halls = data.data;
      } else {
        throw new Error(data.error || 'Failed to load halls');
      }
    },

    formatDateTime(dateStr) {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    editSession(session) {
      this.editingSession = session;
      this.sessionForm = {
        film: session.film ? session.film._id : '',
        hall: session.hall ? session.hall._id : '',
        startTime: this.formatDateTimeForInput(session.startTime),
        endTime: this.formatDateTimeForInput(session.endTime),
        price: {
          standard: session.price.standard || 0,
          student: session.price.student || 0,
          child: session.price.child || 0,
          vip: session.price.vip || 0
        },
        is3D: session.is3D || false,
        subtitles: session.subtitles || '',
        status: session.status || 'scheduled'
      };
      this.showSessionForm = true;
    },

    formatDateTimeForInput(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    closeSessionForm() {
      this.showSessionForm = false;
      this.editingSession = null;
      this.formError = null;
      this.sessionForm = {
        film: '',
        hall: '',
        startTime: '',
        endTime: '',
        price: {
          standard: 0,
          student: 0,
          child: 0,
          vip: 0
        },
        is3D: false,
        subtitles: '',
        status: 'scheduled'
      };
    },

    async saveSession() {
      this.formSubmitting = true;
      this.formError = null;

      try {
        const url = this.editingSession
          ? `${API_BASE_URL}/api/admin/sessions/${this.editingSession._id}`
          : `${API_BASE_URL}/api/admin/sessions`;
        
        const method = this.editingSession ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.sessionForm)
        });

        const data = await response.json();

        if (data.success) {
          await this.loadSessions();
          this.closeSessionForm();
        } else {
          this.formError = data.error || 'Failed to save session';
        }
      } catch (err) {
        this.formError = err.message || 'Failed to save session';
        console.error('Error saving session:', err);
      } finally {
        this.formSubmitting = false;
      }
    },

    async deleteSession(sessionId) {
      if (!confirm('Are you sure you want to delete this session?')) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/sessions/${sessionId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          await this.loadSessions();
        } else {
          alert(data.error || 'Failed to delete session');
        }
      } catch (err) {
        alert(err.message || 'Failed to delete session');
        console.error('Error deleting session:', err);
      }
    },

    async deleteBooking(bookingId) {
      if (!confirm('Are you sure you want to delete this booking?')) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          await this.loadBookings();
        } else {
          alert(data.error || 'Failed to delete booking');
        }
      } catch (err) {
        alert(err.message || 'Failed to delete booking');
        console.error('Error deleting booking:', err);
      }
    },

    async syncCinemasFromApollo() {
      await this.performCinemaSync({
        reloadCinemas: true,
        showDetailedMessage: true,
        useInlineMessage: true
      });
    },

    async syncCinemasFromSessionForm() {
      await this.performCinemaSync({
        reloadCinemas: false,
        showDetailedMessage: false,
        useInlineMessage: false
      });
    },

    async performCinemaSync({ reloadCinemas, showDetailedMessage, useInlineMessage }) {
      this.syncing = true;
      if (useInlineMessage) {
        this.syncMessage = null;
        this.error = null;
      } else {
        this.formError = null;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/apollo-kino/sync-cinemas`);
        const data = await response.json();
        
        if (data.success) {
          // Reload halls (always needed)
          await this.loadHalls();
          
          // Optionally reload cinemas
          if (reloadCinemas) {
            await this.loadCinemas();
          }
          
          // Show success message
          const message = showDetailedMessage
            ? `✅ Successfully synced! Added ${data.results.cinemas.added} cinemas, updated ${data.results.cinemas.updated} cinemas, added ${data.results.halls.added} halls, updated ${data.results.halls.updated} halls.`
            : `✅ Successfully synced ${data.results.cinemas.added + data.results.cinemas.updated} cinemas and ${data.results.halls.added + data.results.halls.updated} halls.`;
          
          if (useInlineMessage) {
            this.syncMessage = message;
            // Clear message after 5 seconds
            setTimeout(() => {
              this.syncMessage = null;
            }, 5000);
          } else {
            this.formError = message;
            // Clear success message after 5 seconds
            setTimeout(() => {
              this.formError = null;
            }, 5000);
          }
        } else {
          const errorMsg = data.error || 'Failed to sync cinemas';
          if (useInlineMessage) {
            this.error = errorMsg;
          } else {
            this.formError = errorMsg;
          }
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to sync cinemas from Apollo Kino API';
        console.error('Error syncing cinemas:', err);
        if (useInlineMessage) {
          this.error = errorMsg;
        } else {
          this.formError = errorMsg;
        }
      } finally {
        this.syncing = false;
      }
    }
  }
}
</script>

<style scoped>
.admin-page {
  min-height: calc(100vh - 200px);
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.page-header {
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)),
    linear-gradient(135deg, #e94560 0%, #0f3460 100%);
  padding: 3rem 0;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #fff;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.page-header .subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.admin {
  padding: 2.5rem 0 3rem;
  color: #fff;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.admin-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0.75rem;
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.05);
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: #fff;
}

.tab-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #e94560 0%, #c73e54 100%);
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.4);
}

.admin-content {
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.section-header h2 {
  font-size: 1.8rem;
  color: #fff;
}

.btn-primary {
  background: linear-gradient(135deg, #e94560 0%, #c73e54 100%);
  color: #fff;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(233, 69, 96, 0.6);
}

.btn-primary:disabled {
  background: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: rgba(15, 52, 96, 0.6);
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.data-table th {
  font-weight: 600;
  color: #fff;
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s ease;
  color: #fff;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.confirmed {
  background: rgba(76, 175, 80, 0.2);
  color: #8be28b;
}

.status-badge.pending {
  background: rgba(255, 193, 7, 0.2);
  color: #ffd36a;
}

.status-badge.scheduled {
  background: rgba(23, 162, 184, 0.2);
  color: #7ad9e5;
}

.status-badge.cancelled {
  background: rgba(244, 67, 54, 0.2);
  color: #ff8a80;
}

.status-badge.completed {
  background: rgba(76, 175, 80, 0.2);
  color: #8be28b;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.error {
  background: rgba(244, 67, 54, 0.12);
  color: #ff6b6b;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.form-success {
  background: rgba(76, 175, 80, 0.15);
  color: #8be28b;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-weight: 600;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.success-message {
  background: rgba(76, 175, 80, 0.15);
  color: #8be28b;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-weight: 600;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.info-message {
  background: rgba(23, 162, 184, 0.15);
  color: #7ad9e5;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border-left: 4px solid rgba(23, 162, 184, 0.6);
}

.btn-success {
  background: linear-gradient(135deg, #28a745 0%, #1f8a3a 100%);
  color: #fff;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(40, 167, 69, 0.45);
}

.btn-success:disabled {
  background: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
  box-shadow: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
}

.close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #fff;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="datetime-local"],
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #e94560;
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.2);
}

.form-group input[type="checkbox"] {
  margin-right: 0.5rem;
}

.form-help-text {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #ffd36a;
  background-color: rgba(255, 193, 7, 0.15);
  padding: 0.5rem;
  border-radius: 8px;
  border-left: 3px solid rgba(255, 193, 7, 0.6);
}

.sync-warning {
  background-color: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.4);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.sync-warning p {
  margin: 0.5rem 0;
  color: #ffd36a;
  font-weight: 600;
}

.sync-warning .btn {
  margin-top: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .admin-tabs {
    overflow-x: auto;
  }
  
  .data-table {
    font-size: 0.9rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal {
    width: 95%;
  }
}
</style>
