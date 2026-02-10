<template>
  <div class="schedule">
    <div class="container">
      <h1>Расписание</h1>
      
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
              :class="['date-btn', { active: selectedDate === date.value, 'no-schedule': !date.hasSchedule }]"
              :title="date.hasSchedule ? '' : 'Sellel kuupäeval pole seanssi'"
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
              <div class="hall-name">{{ formatHall(session.hall, session.cinema) }}</div>
              <button class="btn-trailer">
                <span class="btn-trailer-icon">▶</span>
                Трейлер
              </button>
            </div>
          </div>

          <div class="schedule-card-right">
            <!-- Movie Title and Genre -->
            <div class="movie-details">
              <h3 class="movie-title">{{ session.movieTitle }}</h3>
              <p class="movie-original-title">{{ session.originalTitle }}</p>
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
                <div class="availability-text">
                  <span>Свободно</span>
                  <strong>{{ session.availableSeats }}</strong>
                </div>
              </div>
            </div>

            <!-- Right Side: Buttons and Meta Info -->
            <div class="right-section">
              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="btn-schedule">Все показы</button>
                <button class="btn-buy" @click="goToBooking(session)">Купить билеты</button>
              </div>

              <!-- Language, Subtitles, Format -->
              <div class="meta-info">
                <div class="meta-item">
                  <span class="meta-label">Язык:</span>
                  <span class="meta-value">{{ session.language }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Субтитры:</span>
                  <span class="meta-value">{{ session.subtitles }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Формат:</span>
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
  watch: {
    selectedDate(newDate) {
      // When a date is selected, check if it has sessions
      // If not, find the nearest date with sessions
      if (this.sessions.length > 0) {
        const sessionsForDate = this.sessions.filter(s => s.date === newDate)
        if (sessionsForDate.length === 0 && this.availableDates.length > 0) {
          // Find the closest available date
          const selectedDateObj = new Date(newDate)
          let closestDate = this.availableDates[0]
          let minDiff = Math.abs(new Date(this.availableDates[0]) - selectedDateObj)
          
          for (const availDate of this.availableDates) {
            const diff = Math.abs(new Date(availDate) - selectedDateObj)
            if (diff < minDiff) {
              minDiff = diff
              closestDate = availDate
            }
          }
          
          // Only update if we found a different date
          if (closestDate !== newDate) {
            this.$nextTick(() => {
              this.selectedDate = closestDate
            })
          }
        }
      }
    }
  },
  computed: {
    displayedDates() {
      const startIndex = this.currentWeekIndex * 7
      const dates = this.allDates.slice(startIndex, startIndex + 7)
      
      // Get all available dates from sessions
      const availableDates = new Set(this.sessions.map(s => s.date))
      
      // Mark dates that have sessions
      return dates.map(date => ({
        ...date,
        hasSchedule: availableDates.has(date.value)
      }))
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
    },
    availableDates() {
      // Get unique dates that have sessions, sorted
      return [...new Set(this.sessions.map(s => s.date))].sort()
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
        
        // Fetch both local cinemas and Apollo Kino theatre areas
        const [localCinemasResponse, theatreAreasResponse] = await Promise.all([
          fetch(`${apiUrl}/api/cinemas`).catch(() => null),
          fetch(`${apiUrl}/api/apollo-kino/TheatreAreas`).catch(() => null)
        ]);
        
        let allCinemas = [];
        
        // Process local cinemas
        if (localCinemasResponse && localCinemasResponse.ok) {
          const data = await localCinemasResponse.json();
          if (data.success && data.data) {
            allCinemas = data.data.map(cinema => ({
              _id: cinema._id,
              name: cinema.name
            }));
          }
        }
        
        // Process Apollo Kino theatre areas
        // Note: Apollo Kino API returns ID/Name fields vs local cinemas' _id/name
        if (theatreAreasResponse && theatreAreasResponse.ok) {
          const data = await theatreAreasResponse.json();
          if (data.success && data.data) {
            const theatreAreas = data.data.map(area => ({
              _id: area.ID,
              name: area.Name
            }));
            // Add theatre areas to cinemas list
            allCinemas = [...allCinemas, ...theatreAreas];
          }
        }
        
        this.cinemas = allCinemas;
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
                || 'https://via.placeholder.com/200x300/f97316/1f2937?text=' + encodeURIComponent(show.Title || 'No Image');

              const originalTitle = show.OriginalTitle
                || show.OriginalTitleName
                || show.OriginalEventTitle
                || show.Title
                || 'Unknown';
              
              return {
                id: show.ID || index,
                movieTitle: show.Title || 'Unknown',
                originalTitle,
                genre: Array.isArray(show.Genres) ? show.Genres.join(', ') : (show.Genres || ''),
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
    goToBooking(session) {
      if (!session) return

      this.$router.push({
        name: 'Booking',
        query: {
          film: session.movieTitle,
          cinema: session.cinema,
          cinemaId: session.cinemaId,
          date: session.date,
          time: session.time
        }
      })
    },
    getAvailabilityColor(availability) {
      return '#22c55e'
    },
    getRotation(availability) {
      // Calculate rotation based on availability percentage
      return (availability / 100) * 180
    },
    formatHall(hall, cinema) {
      const hallText = (hall || '').toString().trim()
      const cinemaText = (cinema || '').toString().trim()
      const hallNumber = hallText.match(/\d+/)?.[0]

      if (hallNumber) {
        return cinemaText ? `${hallNumber}. ${cinemaText} зал` : `${hallNumber}. зал`
      }

      if (hallText) {
        return cinemaText ? `${hallText} ${cinemaText} зал` : hallText
      }

      if (cinemaText) {
        return `${cinemaText} зал`
      }

      return 'Зал не указан'
    }
  }
}
</script>

<style scoped>
.schedule {
  padding: 2rem 0;
  min-height: calc(100vh - 200px);
  background: #ffffff;
  color: var(--color-text);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: var(--color-text);
  text-shadow: none;
}

/* Filters Container */
.filters-container {
  background: var(--color-surface);
  padding: 1.5rem 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: nowrap;
  overflow: visible;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  border: 1px solid var(--color-border);
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
  gap: 1.5rem;
}

.filter-section label {
  color: var(--color-text);
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
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 12px;
  background: linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: #fff;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
  min-width: 120px;
  justify-content: center;
}

.dropdown-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(249, 115, 22, 0.4);
  background: linear-gradient(145deg, var(--color-primary-light) 0%, var(--color-primary) 100%);
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
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 100%;
  background: var(--color-surface);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  z-index: 9999;
  overflow: visible;
  animation: dropdownFadeInDown 0.2s ease;
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
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: rgba(249, 115, 22, 0.15);
  color: var(--color-primary);
}

.dropdown-item.active {
  background: rgba(249, 115, 22, 0.2);
  color: var(--color-primary);
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
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1.5rem;
  transition: background-color 0.3s;
}

.date-nav-btn:hover:not(:disabled) {
  background-color: var(--color-surface-muted);
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
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
  min-width: 60px;
  text-align: center;
}

.date-btn:hover {
  background-color: var(--color-surface-muted);
}

.date-btn.active {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.date-btn.no-schedule {
  opacity: 0.4;
  cursor: default;
}

.date-btn.no-schedule:hover {
  background-color: var(--color-surface);
  transform: none;
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
  gap: 2rem;
}

.loading,
.error,
.no-sessions {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  background: var(--color-surface-muted);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  color: var(--color-text);
}

.error {
  color: #ff6b6b;
}

.no-sessions {
  color: var(--color-text-muted);
}

.schedule-card {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  gap: 1.5rem;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid var(--color-border);
}

.schedule-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 60px rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.3);
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
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--color-text);
}

.hall-name {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.btn-trailer {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary-light);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-trailer:hover {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-trailer-icon {
  font-size: 0.85rem;
}

/* Right Side */
.schedule-card-right {
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.movie-details {
  flex: 1;
  min-width: 0;
}

.movie-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.movie-original-title {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin-bottom: 0.4rem;
}

.movie-genre {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 1.2rem;
  font-weight: 500;
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
  align-self: center;
  align-items: stretch;
}

.graph {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 4px rgba(34, 197, 94, 0.2);
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
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  font-weight: 500;
}

.availability-text strong {
  font-size: 1.2rem;
  color: var(--color-text);
}

/* Session Meta */
.meta-info {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.95rem;
  align-items: flex-start;
  padding-right: 1rem;
  border-right: 1px solid var(--color-border);
}

.meta-item:last-child {
  border-right: none;
  padding-right: 0;
}

.meta-label {
  font-weight: 700;
  color: var(--color-text-muted);
}

.meta-value {
  color: var(--color-text);
  font-weight: 600;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  justify-content: center;
  align-items: stretch;
}

.btn-schedule {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary-light);
  border: none;
  border-radius: 10px;
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-schedule:hover {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-buy {
  padding: 0.75rem 1.5rem;
  background-color: var(--color-primary);
  border: none;
  border-radius: 10px;
  color: var(--color-on-primary);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.35);
}

.btn-buy:hover {
  background-color: var(--color-primary-dark);
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
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .meta-item {
    border-right: none;
    padding-right: 0;
  }

  .action-buttons {
    width: 100%;
    flex-direction: column;
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
