<template>
  <div class="movies-page">
    <div class="page-header">
      <div class="container">
        <h1>🎬 All Movies</h1>
        <p class="subtitle">Discover our complete collection of films</p>
      </div>
    </div>

    <div class="container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading movies...</p>
      </div>

      <div v-else-if="error" class="error">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <div v-else class="movie-grid">
        <div
          class="movie-card"
          v-for="(movie, index) in movies"
          :key="index"
        >
          <div class="movie-poster">
            <img :src="movie.posterUrl || 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=' + encodeURIComponent(movie.title)" :alt="movie.title">
            <div class="poster-overlay">
              <div class="rating-badge" v-if="movie.rating">
                <span class="star">★</span>
                <span class="score">{{ movie.rating }}</span>
              </div>
              <div class="overlay-content">
                <router-link
                  v-if="movie._id"
                  :to="`/movies/${movie._id}`"
                  class="btn-view"
                >
                  <span>View Details</span>
                </router-link>

                <a
                  v-else
                  :href="movie.EventURL || '#'"
                  target="_blank"
                  class="btn-view"
                >
                  <span>View Details</span>
                </a>
              </div>
            </div>
          </div>
          <div class="movie-info">
            <h3 class="movie-title">{{ movie.title }}</h3>
            <div class="genre-tags">
              <span 
                v-for="(genre, idx) in (Array.isArray(movie.genre) ? movie.genre.slice(0, 2) : [movie.genre])" 
                :key="idx" 
                class="genre-tag"
              >
                {{ genre }}
              </span>
            </div>
            <div class="meta">
              <span class="duration">
                <span class="icon">🕐</span>
                {{ movie.duration || 'N/A' }} min
              </span>
              <span class="age-rating" :class="getAgeRatingClass(movie.ageRating)">
                {{ movie.ageRating || 'NR' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import axios from 'axios'

export default {
  name: 'Movies',
  data() {
    return {
      movies: [],
      loading: true,
      error: null,
    }
  },
  mounted() {
    this.getMovies();
  },
  methods: {
    getMovies(){
      this.loading = true;
      this.error = null;
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      axios.get(`${apiUrl}/api/apollo-kino/events`)
        .then(res => {
          this.movies = res.data.movies
          this.loading = false;
        })
        .catch(err => {
          console.error('Error fetching movies:', err);
          this.loading = false;
          this.error = `Cannot connect to the backend server. Please make sure the backend is running on ${apiUrl}`;
        });
    },
    getAgeRatingClass(rating) {
      if (!rating) return 'rating-nr';
      const r = rating.toUpperCase();
      if (r === 'G' || r === 'PG') return 'rating-g';
      if (r === 'PG-13') return 'rating-pg13';
      if (r === 'R' || r === 'NC-17') return 'rating-r';
      return 'rating-nr';
    }
  },
}
</script>

<style scoped>
.movies-page {
  min-height: calc(100vh - 200px);
  background: #f5f5f5;
}

.page-header {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  padding: 4rem 0;
  text-align: center;
  margin-bottom: 2rem;
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
    linear-gradient(45deg, rgba(255, 102, 0, 0.15) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
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
  color: #e0e0e0;
  font-size: 1.2rem;
}

.container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 1.5rem 3rem;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.movie-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;
}

.movie-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.movie-poster {
  position: relative;
  overflow: hidden;
  aspect-ratio: 2/3;
}

.movie-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.movie-card:hover .movie-poster img {
  transform: scale(1.05);
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.movie-card:hover .poster-overlay {
  opacity: 1;
}

.rating-badge {
  align-self: flex-end;
  background: #f39c12;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
}

.rating-badge .star {
  color: #fff;
  font-size: 0.9rem;
}

.rating-badge .score {
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}

.overlay-content {
  display: flex;
  justify-content: center;
}

.btn-view {
  background: #ff6600;
  color: #fff;
  color: #fff;
  padding: 0.9rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-view:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.5);
  background: #e65c00;
}

.movie-info {
  padding: 1.25rem;
}

.movie-title {
  color: #2c3e50;
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.genre-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.genre-tag {
  background: #fef5f3;
  color: #ff6600;
  padding: 0.3rem 0.7rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #fdd;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.duration {
  color: #7f8c8d;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.duration .icon {
  font-size: 0.85rem;
}

.age-rating {
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.rating-g {
  background: #2ecc71;
  color: #fff;
}

.rating-pg13 {
  background: #f39c12;
  color: #fff;
}

.rating-r {
  background: #ff6600;
  color: #fff;
}

.rating-nr {
  background: #95a5a6;
  color: #fff;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #2c3e50;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f5f5f5;
  border-top-color: #ff6600;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #fee;
  border-radius: 12px;
  border: 1px solid #fcc;
  color: #e65c00;
  text-align: center;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
  }
  
  .movie-info {
    padding: 1rem;
  }
  
  .movie-title {
    font-size: 1rem;
  }
}
</style>