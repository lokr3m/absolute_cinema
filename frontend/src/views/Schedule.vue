<template>
  <div class="schedule">
    <div class="container">
      <h1>KAVA</h1>
      
      <!-- Filters Section -->
      <div class="filters-container">
        <!-- Cinema Selection -->
        <div class="filter-section">
          <div class="custom-dropdown" :class="{ open: cinemaDropdownOpen }">
            <button class="dropdown-btn" @click="toggleCinemaDropdown">
              <span class="dropdown-icon">🎬</span>
              <span>Kino</span>
              <span class="arrow">▼</span>
            </button>
            <div class="dropdown-menu" v-if="cinemaDropdownOpen">
              <div 
                class="dropdown-item" 
                :class="{ active: selectedCinema === '' }"
                @click="selectCinema('')"
              >
                Kõik kinod
              </div>
              <div 
                v-for="cinema in cinemas" 
                :key="cinema._id" 
                class="dropdown-item"
                :class="{ active: selectedCinema === cinema._id }"
                @click="selectCinema(cinema._id)"
              >
                {{ cinema.name }}
              </div>
            </div>
          </div>
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
            <div class="custom-dropdown" :class="{ open: genreDropdownOpen }">
              <button class="dropdown-btn dropdown-btn-compact" @click="toggleGenreDropdown">
                <span class="dropdown-icon">🎭</span>
                <span>Žanr</span>
                <span class="arrow">▼</span>
              </button>
              <div class="dropdown-menu" v-if="genreDropdownOpen">
                <div 
                  class="dropdown-item" 
                  :class="{ active: selectedGenre === '' }"
                  @click="selectGenre('')"
                >
                  Kõik žanrid
                </div>
                <div class="dropdown-item" :class="{ active: selectedGenre === 'action' }" @click="selectGenre('action')">Action</div>
                <div class="dropdown-item" :class="{ active: selectedGenre === 'comedy' }" @click="selectGenre('comedy')">Comedy</div>
                <div class="dropdown-item" :class="{ active: selectedGenre === 'drama' }" @click="selectGenre('drama')">Drama</div>
                <div class="dropdown-item" :class="{ active: selectedGenre === 'horror' }" @click="selectGenre('horror')">Horror</div>
                <div class="dropdown-item" :class="{ active: selectedGenre === 'scifi' }" @click="selectGenre('scifi')">Sci-Fi</div>
              </div>
            </div>
          </div>

          <div class="filter-section">
            <div class="custom-dropdown" :class="{ open: formatDropdownOpen }">
              <button class="dropdown-btn dropdown-btn-compact" @click="toggleFormatDropdown">
                <span class="dropdown-icon">📽️</span>
                <span>Formaat</span>
                <span class="arrow">▼</span>
              </button>
              <div class="dropdown-menu" v-if="formatDropdownOpen">
                <div 
                  class="dropdown-item" 
                  :class="{ active: selectedFormat === '' }"
                  @click="selectFormat('')"
                >
                  Kõik formaadid
                </div>
                <div class="dropdown-item" :class="{ active: selectedFormat === '2D' }" @click="selectFormat('2D')">2D</div>
                <div class="dropdown-item" :class="{ active: selectedFormat === '3D' }" @click="selectFormat('3D')">3D</div>
              </div>
            </div>
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
      error: null,
      cinemaDropdownOpen: false,
      genreDropdownOpen: false,
      formatDropdownOpen: false
    }
  },
  created() {
    this.allDates = this.generateDates()
    this.fetchCinemas()
    this.fetchSchedule()
    // Close dropdowns when clicking outside
    document.addEventListener('click', this.closeAllDropdowns)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeAllDropdowns)
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
          
          // Try different possible structures (similar to fetchEvents pattern)
          let shows = [];
          if (scheduleData) {
            if (scheduleData.Schedule?.Shows?.Show) {
              // Structure: { Schedule: { Shows: { Show: [...] } } }
              shows = Array.isArray(scheduleData.Schedule.Shows.Show)
                ? scheduleData.Schedule.Shows.Show
                : [scheduleData.Schedule.Shows.Show];
            } else if (scheduleData.Shows?.Show) {
              // Structure: { Shows: { Show: [...] } }
              shows = Array.isArray(scheduleData.Shows.Show)
                ? scheduleData.Shows.Show
                : [scheduleData.Shows.Show];
            } else if (Array.isArray(scheduleData.Shows)) {
              // Structure: { Shows: [...] }
              shows = scheduleData.Shows;
            } else if (Array.isArray(scheduleData)) {
              // Structure: [...]
              shows = scheduleData;
            }
          }
          
          if (shows.length > 0) {
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
              
              // Extract language name from object if it's an object
              const spokenLang = typeof show.SpokenLanguage === 'object' 
                ? (show.SpokenLanguage?.Name || 'Unknown')
                : (show.SpokenLanguage || 'Unknown');
              
              // Extract subtitle language name from object if it's an object
              const subtitleLang = typeof show.SubtitleLanguage1 === 'object'
                ? (show.SubtitleLanguage1?.Name || 'Puudub')
                : (show.SubtitleLanguage1 || 'Puudub');
              
              // Try multiple possible poster URL fields
              const posterUrl = show.Images?.EventMediumImagePortrait 
                || show.EventMediumImagePortrait 
                || show.Images?.EventSmallImagePortrait
                || show.EventSmallImagePortrait
                || 'https://via.placeholder.com/200x300/1a1a2e/e94560?text=' + encodeURIComponent(show.Title || 'No Image');
              
              return {
                id: show.ID || index,
                movieTitle: show.Title || 'Unknown',
                genre: show.Genres || '',
                time: `${hours}:${minutes}`,
                cinema: show.TheatreName || show.Theatre || 'Unknown Cinema',
                cinemaId: show.TheatreID || '',
                hall: show.TheatreAuditorium || 'Unknown Hall',
                posterUrl: posterUrl,
                language: spokenLang,
                subtitles: subtitleLang,
                format: show.PresentationMethod?.includes('3D') ? '3D' : '2D',
                availability: availabilityPercent,
                availableSeats: seatsAvailable,
                date: showDate,
                showUrl: show.ShowURL || '#'
              };
            });
            
            // Auto-select first available date if no sessions for selected date
            const sessionsForSelectedDate = this.sessions.filter(s => s.date === this.selectedDate);
            if (sessionsForSelectedDate.length === 0 && this.sessions.length > 0) {
              const availableDates = [...new Set(this.sessions.map(s => s.date))].sort();
              if (availableDates.length > 0) {
                this.selectedDate = availableDates[0];
              }
            }
          } else {
            this.sessions = [];
          }
          
          this.loading = false;
        })
        .catch(err => {
          console.error('Error fetching schedule:', err);
          this.loading = false;
          this.error = err.response?.data?.message || err.message || 'Failed to fetch schedule data';
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
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

/* Filters Container */
.filters-container {
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  padding: 1.5rem 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.filter-section label {
  color: #fff;
  font-weight: bold;
  font-size: 0.9rem;
  white-space: nowrap;
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
  padding: 0.75rem 1.25rem;
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 12px;
  background: linear-gradient(145deg, #e94560 0%, #c73e54 100%);
  color: #fff;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
  min-width: 120px;
  justify-content: center;
}

.dropdown-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(233, 69, 96, 0.5);
  background: linear-gradient(145deg, #ff5a75 0%, #e94560 100%);
}

.dropdown-btn-compact {
  min-width: 110px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
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
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 100%;
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 12px;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  overflow: hidden;
  animation: dropdownFadeInUp 0.2s ease;
}

@keyframes dropdownFadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.dropdown-item {
  padding: 0.75rem 1.25rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
}

.dropdown-item.active {
  background: rgba(233, 69, 96, 0.3);
  color: #e94560;
  font-weight: 600;
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
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  color: #fff;
}

.error {
  color: #ff6b6b;
}

.no-sessions {
  color: rgba(255, 255, 255, 0.7);
}

.schedule-card {
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  gap: 1.5rem;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.schedule-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 60px rgba(233, 69, 96, 0.2);
  border-color: rgba(233, 69, 96, 0.3);
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
  color: #fff;
}

.cinema-name {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: bold;
}

.hall-name {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: bold;
}

.btn-trailer {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(233, 69, 96, 0.2);
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  color: #e94560;
  transition: all 0.3s;
}

.btn-trailer:hover {
  background: rgba(233, 69, 96, 0.3);
  border-color: #e94560;
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
  color: #fff;
  margin-bottom: 0.5rem;
}

.movie-genre {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
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
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border-radius: 50%;
}

.availability-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
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
  color: rgba(255, 255, 255, 0.7);
}

.meta-value {
  color: #fff;
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
