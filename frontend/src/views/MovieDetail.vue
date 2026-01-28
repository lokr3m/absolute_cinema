<template>
  <div class="movie-detail">
    <div class="container">
      <div v-if="loading" class="loading">Loading movie details...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else>
        <div class="movie-header">
          <div class="movie-poster">
            <img :src="film.posterUrl || 'https://via.placeholder.com/400x600'" :alt="film.title">
          </div>
          <div class="movie-info">
            <h1>{{ film.title }}</h1>
            <p v-if="film.originalTitle && film.originalTitle !== film.title" class="original-title">
              {{ film.originalTitle }}
            </p>
            <div class="meta">
              <span class="rating" v-if="film.rating">⭐ {{ film.rating }}/10</span>
              <span class="year" v-if="film.productionYear">{{ film.productionYear }}</span>
              <span class="duration">{{ film.duration }} min</span>
              <span class="age-rating">{{ film.ageRating }}</span>
            </div>
            <div class="genres" v-if="film.genre && film.genre.length > 0">
              <span class="genre-tag" v-for="(genre, idx) in film.genre" :key="idx">{{ genre }}</span>
            </div>
            <p class="description">{{ film.description }}</p>
            <div class="cast" v-if="film.cast && film.cast.length > 0">
              <h3>Cast:</h3>
              <p>{{ film.cast.join(', ') }}</p>
            </div>
            <div class="director" v-if="film.director">
              <h3>Director:</h3>
              <p>{{ film.director }}</p>
            </div>
            <router-link 
              :to="{ name: 'Booking', query: { filmId: film._id } }" 
              class="btn btn-primary"
            >
              Book Tickets
            </router-link>
          </div>
        </div>

        <div class="showtimes" v-if="sessions.length > 0">
          <h2>Showtimes</h2>
          <div class="sessions-by-date">
            <div v-for="(sessionsOnDate, date) in groupedSessions" :key="date" class="date-group">
              <h3 class="date-header">{{ formatDate(date) }}</h3>
              <div class="sessions-by-cinema">
                <div v-for="(sessionsByCinema, cinemaName) in sessionsOnDate" :key="cinemaName" class="cinema">
                  <h4>{{ cinemaName }}</h4>
                  <div class="times">
                    <button 
                      class="time-btn" 
                      v-for="session in sessionsByCinema" 
                      :key="session._id"
                      @click="bookSession(session)"
                    >
                      <div class="time">{{ formatTime(session.startTime) }}</div>
                      <div class="hall-info">{{ session.hall.name }}</div>
                      <div class="price">€{{ session.price.standard }}</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-sessions">
          <p>No sessions available for this film at the moment.</p>
        </div>

        <div class="trailer" v-if="film.trailerUrl">
          <h2>Trailer</h2>
          <div class="video-container">
            <iframe 
              :src="film.trailerUrl" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'MovieDetail',
  data() {
    return {
      film: null,
      sessions: [],
      loading: true,
      error: null
    }
  },
  computed: {
    apiUrl() {
      return import.meta.env.VITE_API_URL || 'http://localhost:3000'
    },
    groupedSessions() {
      const grouped = {}
      
      this.sessions.forEach(session => {
        const date = new Date(session.startTime).toDateString()
        const cinemaName = session.hall?.cinema?.name || 'Unknown Cinema'
        
        if (!grouped[date]) {
          grouped[date] = {}
        }
        
        if (!grouped[date][cinemaName]) {
          grouped[date][cinemaName] = []
        }
        
        grouped[date][cinemaName].push(session)
      })
      
      return grouped
    }
  },
  async mounted() {
    await this.loadFilmDetails()
    await this.loadSessions()
  },
  methods: {
    async loadFilmDetails() {
      try {
        const filmId = this.$route.params.id
        const response = await axios.get(`${this.apiUrl}/api/films/${filmId}`)
        this.film = response.data.data
        this.loading = false
      } catch (err) {
        console.error('Error loading film:', err)
        this.error = 'Failed to load film details'
        this.loading = false
      }
    },
    async loadSessions() {
      try {
        const filmId = this.$route.params.id
        const response = await axios.get(`${this.apiUrl}/api/films/${filmId}/sessions`)
        this.sessions = response.data.data || []
      } catch (err) {
        console.error('Error loading sessions:', err)
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today'
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow'
      } else {
        return date.toLocaleDateString('en-GB', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        })
      }
    },
    formatTime(dateTime) {
      return new Date(dateTime).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    },
    bookSession(session) {
      this.$router.push({
        name: 'Booking',
        query: {
          filmId: this.film._id,
          sessionId: session._id
        }
      })
    }
  }
}
</script>

<style scoped>
.movie-detail {
  padding: 3rem 0;
  min-height: calc(100vh - 200px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #666;
}

.error {
  padding: 2rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  text-align: center;
}

.movie-header {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.movie-poster img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.movie-info h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.original-title {
  font-size: 1.1rem;
  color: #666;
  font-style: italic;
  margin-bottom: 1rem;
}

.meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  flex-wrap: wrap;
}

.rating {
  color: #f5c518;
  font-weight: 600;
}

.year,
.duration,
.age-rating {
  color: #666;
}

.genres {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.genre-tag {
  background: #e50914;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.description {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.cast,
.director {
  margin-bottom: 1rem;
}

.cast h3,
.director h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.cast p,
.director p {
  color: #666;
}

.btn-primary {
  display: inline-block;
  background-color: #e50914;
  color: #fff;
  padding: 1rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 1rem;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #c00812;
}

.showtimes {
  background: #f5f5f5;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 3rem;
}

.showtimes h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.sessions-by-date {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.date-group {
  border-bottom: 1px solid #ddd;
  padding-bottom: 1.5rem;
}

.date-group:last-child {
  border-bottom: none;
}

.date-header {
  font-size: 1.4rem;
  color: #333;
  margin-bottom: 1rem;
  font-weight: 600;
}

.sessions-by-cinema {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cinema h4 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #555;
}

.times {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.time-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  min-width: 100px;
}

.time-btn:hover {
  background-color: #333;
  color: #fff;
  border-color: #333;
}

.time-btn .time {
  font-size: 1rem;
  font-weight: 700;
}

.time-btn .hall-info {
  font-size: 0.8rem;
  font-weight: 400;
}

.time-btn .price {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e50914;
}

.time-btn:hover .price {
  color: #fff;
}

.no-sessions {
  background: #fff3cd;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  color: #856404;
  margin-bottom: 3rem;
}

.trailer {
  margin-bottom: 2rem;
}

.trailer h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.video-container {
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: 8px;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .movie-header {
    grid-template-columns: 1fr;
  }
  
  .times {
    flex-wrap: wrap;
  }
}
</style>
