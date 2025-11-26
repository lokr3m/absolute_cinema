<template>
  <div class="schedule">
    <div class="container">
      <h1>KAVA</h1>
      
      <!-- Filters Section -->
      <div class="filters-container">
        <!-- Cinema Selection -->
        <div class="filter-section">
          <label>Kino:</label>
          <select v-model="selectedCinema" class="filter-select">
            <option value="">Kõik kinod</option>
            <option v-for="cinema in cinemas" :key="cinema._id" :value="cinema._id">
              {{ cinema.name }}
            </option>
          </select>
        </div>

        <!-- Date Selection -->
        <div class="date-selection">
          <button @click="previousWeek" class="date-nav-btn" :disabled="currentWeekIndex === 0">
            <span>‹</span>
          </button>
          <div class="dates-container">
            <button
              v-for="(date, index) in displayedDates"
              :key="index"
              @click="selectedDate = date.value"
              :class="['date-btn', { active: selectedDate === date.value }]"
            >
              <div class="date-day">{{ date.day }}</div>
              <div class="date-number">{{ date.number }}</div>
            </button>
          </div>
          <button @click="nextWeek" class="date-nav-btn">
            <span>›</span>
          </button>
        </div>

        <!-- Genre and Format Filters -->
        <div class="filter-group">
          <div class="filter-section">
            <label>Žanr:</label>
            <select v-model="selectedGenre" class="filter-select filter-select-compact">
              <option value="">Kõik žanrid</option>
              <option value="action">Action</option>
              <option value="comedy">Comedy</option>
              <option value="drama">Drama</option>
              <option value="horror">Horror</option>
              <option value="scifi">Sci-Fi</option>
            </select>
          </div>

          <div class="filter-section">
            <label>Formaat:</label>
            <select v-model="selectedFormat" class="filter-select filter-select-compact">
              <option value="">Kõik formaadid</option>
              <option value="2D">2D</option>
              <option value="3D">3D</option>
            </select>
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
                <button class="btn-buy">Osta Piletid</button>
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
      cinemas: [],
      loading: false,
      error: null
    }
  },
  created() {
    this.allDates = this.generateDates()
    this.fetchCinemas()
    this.fetchSchedule()
  },
  computed: {
    displayedDates() {
      const startIndex = this.currentWeekIndex * 7
      return this.allDates.slice(startIndex, startIndex + 7)
    },
    filteredSessions() {
      return this.sessions.filter(session => {
        let matches = true
        
        if (this.selectedCinema && session.cinemaId !== this.selectedCinema) {
          matches = false
        }
        
        if (this.selectedGenre && !session.genre.toLowerCase().includes(this.selectedGenre.toLowerCase())) {
          matches = false
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
    }
  },
  methods: {
    async fetchCinemas() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/cinemas`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            this.cinemas = data.data || [];
          }
        }
      } catch (err) {
        console.error('Error fetching cinemas:', err);
      }
    },
    fetchSchedule() {
      this.loading = true;
      this.error = null;
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      axios.get(`${apiUrl}/api/apollo-kino/schedule`)
        .then(res => {
          // Transform the schedule data to sessions format
          const scheduleData = res.data.schedule;
          const showsData = scheduleData?.Schedule?.Shows?.Show;
          
          if (showsData) {
            const shows = Array.isArray(showsData) ? showsData : [showsData];
            
            this.sessions = shows.map((show, index) => {
              const startTime = new Date(show.dttmShowStart);
              const hours = startTime.getHours().toString().padStart(2, '0');
              const minutes = startTime.getMinutes().toString().padStart(2, '0');
              const showDate = startTime.toISOString().split('T')[0];
              const seatsAvailable = parseInt(show.SeatsAvailable) || 0;
              const totalSeats = parseInt(show.TotalSeats) || 100;
              const availabilityPercent = totalSeats > 0 
                ? Math.round((seatsAvailable / totalSeats) * 100) 
                : DEFAULT_AVAILABILITY_PERCENT;
              
              return {
                id: show.ID || index,
                movieTitle: show.Title || 'Unknown',
                genre: show.Genres || '',
                time: `${hours}:${minutes}`,
                cinema: show.TheatreName || show.Theatre || 'Unknown Cinema',
                cinemaId: show.TheatreID || '',
                hall: show.TheatreAuditorium || 'Unknown Hall',
                posterUrl: show.EventMediumImagePortrait || 'https://via.placeholder.com/200x300/333/fff?text=No+Image',
                language: show.SpokenLanguage || 'Unknown',
                subtitles: show.SubtitleLanguage1 || 'Puudub',
                format: show.PresentationMethod?.includes('3D') ? '3D' : '2D',
                availability: availabilityPercent,
                availableSeats: seatsAvailable,
                date: showDate,
                showUrl: show.ShowURL || '#'
              };
            });
          } else {
            this.sessions = [];
          }
          
          this.loading = false;
        })
        .catch(err => {
          console.error('Error fetching schedule:', err);
          this.loading = false;
          this.error = `Cannot connect to the backend server. Please make sure the backend is running.`;
        });
    },
    generateDates() {
      const dates = []
      const today = new Date()
      const days = ['L', 'P', 'E', 'T', 'K', 'N', 'R'] // Estonian day abbreviations (L=Sunday, P=Monday, etc.)
      
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
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
  background-color: #f5f5f5;
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

/* Filters Container */
.filters-container {
  background-color: #1a1a1a;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-section label {
  color: #fff;
  font-weight: bold;
  font-size: 0.9rem;
  white-space: nowrap;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #2a2a2a;
  color: #fff;
  cursor: pointer;
  font-size: 0.95rem;
  min-width: 180px;
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg fill="%23ffffff" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.2rem;
  padding-right: 2rem;
}

.filter-select-compact {
  min-width: 140px;
  padding: 0.4rem 2rem 0.4rem 0.75rem;
  font-size: 0.9rem;
  background-size: 1rem;
  background-position: right 0.4rem center;
}

/* Date Selection */
.date-selection {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.date-nav-btn {
  background-color: #2a2a2a;
  border: 1px solid #444;
  color: #fff;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1.5rem;
  transition: background-color 0.3s;
}

.date-nav-btn:hover:not(:disabled) {
  background-color: #3a3a3a;
}

.date-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dates-container {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.date-btn {
  background-color: #2a2a2a;
  border: 1px solid #444;
  color: #fff;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
  min-width: 60px;
  text-align: center;
}

.date-btn:hover {
  background-color: #3a3a3a;
}

.date-btn.active {
  background-color: #e67e22;
  border-color: #e67e22;
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
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error {
  color: #e50914;
}

.no-sessions {
  color: #666;
}

.schedule-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1.5rem;
  transition: box-shadow 0.3s;
}

.schedule-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
  border-radius: 4px;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-time {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.cinema-name {
  font-size: 0.95rem;
  color: #666;
  font-weight: bold;
}

.hall-name {
  font-size: 0.9rem;
  color: #999;
  font-weight: bold;
}

.btn-trailer {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn-trailer:hover {
  background-color: #e5e5e5;
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
  color: #333;
  margin-bottom: 0.5rem;
}

.movie-genre {
  font-size: 0.9rem;
  color: #666;
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
  background-color: #fff;
  border-radius: 50%;
}

.availability-text {
  font-size: 0.9rem;
  color: #666;
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
  color: #333;
}

.meta-value {
  color: #333;
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
  background-color: #f0ad4e;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  opacity: 0.7;
}

.btn-schedule:hover {
  background-color: #ec971f;
}

.btn-buy {
  padding: 0.75rem 1.5rem;
  background-color: #e67e22;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-buy:hover {
  background-color: #d35400;
}

/* Responsive Design */
@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .filter-group {
    flex-direction: column;
    width: 100%;
    gap: 1rem;
  }

  .filter-section {
    width: 100%;
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
