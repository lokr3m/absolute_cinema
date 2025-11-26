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
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.page-header {
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)),
    linear-gradient(135deg, #e94560 0%, #0f3460 100%);
  padding: 3rem 0;
  text-align: center;
  margin-bottom: 2rem;
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
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.movie-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 60px rgba(233, 69, 96, 0.2);
  border-color: rgba(233, 69, 96, 0.3);
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
  transform: scale(1.1);
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.95) 0%,
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
  background: linear-gradient(135deg, #f5c518 0%, #e6a800 100%);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  box-shadow: 0 4px 15px rgba(245, 197, 24, 0.4);
}

.rating-badge .star {
  color: #1a1a2e;
  font-size: 0.9rem;
}

.rating-badge .score {
  color: #1a1a2e;
  font-weight: 700;
  font-size: 0.9rem;
}

.overlay-content {
  display: flex;
  justify-content: center;
}

.btn-view {
  background: linear-gradient(135deg, #e94560 0%, #c73e54 100%);
  color: #fff;
  padding: 0.9rem 2rem;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.4);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-view:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(233, 69, 96, 0.6);
  background: linear-gradient(135deg, #ff5a75 0%, #e94560 100%);
}

.movie-info {
  padding: 1.25rem;
}

.movie-title {
  color: #fff;
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
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  padding: 0.3rem 0.7rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(233, 69, 96, 0.3);
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.duration {
  color: rgba(255, 255, 255, 0.7);
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
  background: #4caf50;
  color: #fff;
}

.rating-pg13 {
  background: #ff9800;
  color: #fff;
}

.rating-r {
  background: #f44336;
  color: #fff;
}

.rating-nr {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #fff;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(233, 69, 96, 0.2);
  border-top-color: #e94560;
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
  background: rgba(244, 67, 54, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: #ff6b6b;
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
