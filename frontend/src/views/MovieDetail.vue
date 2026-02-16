<template>
  <div class="movie-detail">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading movie details...</p>
      </div>

      <div v-else-if="error" class="error">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <div v-else>
        <div class="movie-header">
          <div class="movie-poster">
            <img :src="movie.posterUrl || 'https://via.placeholder.com/400x600'" :alt="movie.title">
          </div>
          <div class="movie-info">
            <h1>{{ movie.title }}</h1>
            <p v-if="showOriginalTitle" class="original-title">{{ movie.originalTitle }}</p>
            <div class="meta">
              <span v-if="movie.rating" class="rating">⭐ {{ movie.rating }}/10</span>
              <span v-if="releaseYear" class="year">{{ releaseYear }}</span>
              <span class="duration">{{ movie.duration || 'N/A' }} min</span>
              <span class="age-rating">{{ movie.ageRating || 'NR' }}</span>
            </div>
            <div class="genres" v-if="genres.length">
              <span class="genre-tag" v-for="genre in genres" :key="genre">{{ genre }}</span>
            </div>
            <p class="description">{{ movie.description || 'No description available.' }}</p>
            <div class="cast">
              <h3>Cast:</h3>
              <p>{{ castText }}</p>
            </div>
            <div class="director">
              <h3>Director:</h3>
              <p>{{ movie.director || 'Unknown' }}</p>
            </div>
            <router-link to="/schedule" class="btn btn-primary">View Schedule</router-link>
          </div>
        </div>

        <div class="showtimes">
          <h2>Movie details</h2>
          <div class="details-grid">
            <div v-if="movie.originalTitle" class="detail-item">
              <span class="detail-label">Original title</span>
              <span class="detail-value">{{ movie.originalTitle }}</span>
            </div>
            <div v-if="releaseYear" class="detail-item">
              <span class="detail-label">Release year</span>
              <span class="detail-value">{{ releaseYear }}</span>
            </div>
            <div v-if="movie.language" class="detail-item">
              <span class="detail-label">Language</span>
              <span class="detail-value">{{ movie.language }}</span>
            </div>
            <div v-if="subtitlesText" class="detail-item">
              <span class="detail-label">Subtitles</span>
              <span class="detail-value">{{ subtitlesText }}</span>
            </div>
            <div v-if="movie.duration" class="detail-item">
              <span class="detail-label">Duration</span>
              <span class="detail-value">{{ movie.duration }} min</span>
            </div>
            <div v-if="movie.ageRating" class="detail-item">
              <span class="detail-label">Age rating</span>
              <span class="detail-value">{{ movie.ageRating }}</span>
            </div>
            <div v-if="movie.EventURL" class="detail-item">
              <span class="detail-label">Event link</span>
              <a class="detail-link" :href="movie.EventURL" target="_blank" rel="noopener">Open Apollo Kino</a>
            </div>
          </div>
        </div>

        <div class="trailer" v-if="movie.trailerUrl || movie.EventURL">
          <h2>Trailer</h2>
          <div class="video-placeholder">
            <a
              :href="movie.trailerUrl || movie.EventURL"
              target="_blank"
              rel="noopener"
              class="video-link"
            >
              {{ movie.trailerUrl ? 'Watch trailer on YouTube' : 'View on Apollo Kino' }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const sampleMovies = [
  {
    _id: 'sample1',
    title: 'The Matrix',
    originalTitle: 'The Matrix',
    description: 'A computer hacker learns about the true nature of reality and his role in the war against its controllers.',
    duration: 136,
    genre: ['Action', 'Sci-Fi'],
    director: 'The Wachowskis',
    cast: ['Keanu Reeves', 'Carrie-Anne Moss', 'Laurence Fishburne'],
    releaseDate: '1999-03-31',
    language: 'English',
    subtitles: ['Estonian'],
    ageRating: 'R',
    posterUrl: 'https://via.placeholder.com/400x600/1a1a2e/e94560?text=The+Matrix',
    trailerUrl: 'https://www.youtube.com/watch?v=vKQi3bBA1y8'
  }
]

export default {
  name: 'MovieDetail',
  data() {
    return {
      movie: null,
      loading: true,
      error: null
    }
  },
  computed: {
    genres() {
      if (!this.movie?.genre) return []
      return Array.isArray(this.movie.genre) ? this.movie.genre : [this.movie.genre]
    },
    castText() {
      if (!this.movie?.cast || this.movie.cast.length === 0) return 'No cast information available.'
      return Array.isArray(this.movie.cast) ? this.movie.cast.join(', ') : this.movie.cast
    },
    releaseYear() {
      if (!this.movie) return ''
      if (this.movie.productionYear) return this.movie.productionYear
      if (!this.movie.releaseDate) return ''
      const date = new Date(this.movie.releaseDate)
      return Number.isNaN(date.getTime()) ? '' : date.getFullYear()
    },
    subtitlesText() {
      if (!this.movie?.subtitles || this.movie.subtitles.length === 0) return ''
      return Array.isArray(this.movie.subtitles) ? this.movie.subtitles.join(', ') : this.movie.subtitles
    },
    showOriginalTitle() {
      return this.movie?.originalTitle && this.movie.originalTitle !== this.movie?.title
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler() {
        this.fetchMovie()
      }
    }
  },
  methods: {
    normalizeMovieId(movie) {
      return movie?.apolloKinoId ?? movie?._id ?? movie?.id
    },
    findMovie(movies) {
      const targetId = String(this.$route.params.id || '')
      return movies.find(movie => {
        const idValue = this.normalizeMovieId(movie)
        if (idValue === undefined || idValue === null) return false
        return String(idValue) === targetId
      })
    },
    getSampleMovie() {
      return this.findMovie(sampleMovies)
    },
    setFallbackMovie(message) {
      this.movie = this.getSampleMovie()
      if (!this.movie) {
        this.error = message
      }
    },
    async fetchMovie() {
      this.loading = true
      this.error = null
      this.movie = null

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
<<<<<<< HEAD
      const movieId = this.$route.params.id

      try {
        // Fetch movie from database using MongoDB ID
        const response = await axios.get(`${apiUrl}/api/films/${movieId}`)
        
        if (response.data?.success && response.data?.data) {
          this.movie = response.data.data
=======

      try {
        const response = await axios.get(`${apiUrl}/api/apollo-kino/events`)
        const movies = Array.isArray(response.data?.movies) ? response.data.movies : []
        const matchedMovie = this.findMovie(movies)
        if (matchedMovie) {
          this.movie = matchedMovie
>>>>>>> 57cc3298e6cc73f1183838a3355b4d2edb0120ba
        } else {
          this.setFallbackMovie('Movie not found.')
        }
      } catch (error) {
        console.error('Error fetching movie details:', error)
<<<<<<< HEAD
        // If movie not found in database, show error
        if (error.response?.status === 404) {
          this.setFallbackMovie('Movie not found.')
        } else {
          this.setFallbackMovie('Failed to load movie details.')
        }
=======
        this.setFallbackMovie('Failed to load movie details.')
>>>>>>> 57cc3298e6cc73f1183838a3355b4d2edb0120ba
      } finally {
        this.loading = false
      }
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

.loading,
.error {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  margin: 0 auto 1rem;
}

.error {
  color: #b00020;
}

.error-icon {
  margin-right: 0.5rem;
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
  margin-bottom: 1rem;
}

.meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 1.1rem;
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

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem 2rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.detail-value,
.detail-link {
  color: #666;
}

.detail-link {
  text-decoration: underline;
}

.trailer h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.video-placeholder {
  background: #000;
  height: 200px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.2rem;
  text-align: center;
  padding: 1rem;
}

.video-link {
  color: #fff;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .movie-header {
    grid-template-columns: 1fr;
  }

  .meta {
    flex-wrap: wrap;
  }
}
</style>