<template>
  <div class="home">
    <section class="featured">
      <div class="container">
        <!-- Cinema Selector -->
        <div class="cinema-selector-wrapper">
          <div class="custom-dropdown" :class="{ open: cinemaDropdownOpen }">
            <button class="dropdown-btn" @click="toggleCinemaDropdown">
              <span class="dropdown-icon">🎬</span>
              <span>{{ selectedCinemaName || 'Kõik kinod' }}</span>
              <span class="arrow">▼</span>
            </button>
            <div class="dropdown-menu" v-if="cinemaDropdownOpen">
              <div 
                class="dropdown-item" 
                :class="{ active: selectedCinema === '' }"
                @click="selectCinema('', 'Kõik kinod')"
              >
                Kõik kinod
              </div>
              <div 
                v-for="cinema in cinemas" 
                :key="cinema._id" 
                class="dropdown-item"
                :class="{ active: selectedCinema === cinema._id }"
                @click="selectCinema(cinema._id, cinema.name)"
              >
                {{ cinema.name }}
              </div>
            </div>
          </div>
        </div>

        <div class="section-header">
          <h2>Top films</h2>
        </div>
        
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>Loading featured movies...</p>
        </div>

        <div v-else-if="error" class="error">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>

        <div v-else class="movie-grid">
          <div class="movie-card" v-for="movie in filteredMovies" :key="movie._id || movie.title">
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
                    View Details
                  </router-link>
                  <a 
                    v-else
                    :href="movie.EventURL || '#'" 
                    target="_blank"
                    class="btn-view"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
            <div class="movie-info">
              <h3>{{ movie.title }}</h3>
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
                <span class="duration">🕐 {{ movie.duration || 'N/A' }} min</span>
                <span class="age-badge" :class="getAgeRatingClass(movie.ageRating)">
                  {{ movie.ageRating || 'NR' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="view-all-container">
          <router-link to="/movies" class="btn-view-all">
            View All Movies →
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Home',
  data() {
    return {
      featuredMovies: [],
      cinemas: [],
      selectedCinema: '',
      selectedCinemaName: '',
      cinemaDropdownOpen: false,
      loading: false,
      error: null
    }
  },
  created() {
    document.addEventListener('click', this.closeDropdown)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeDropdown)
  },
  computed: {
    filteredMovies() {
      if (!this.selectedCinema) {
        return this.featuredMovies;
      }
      return this.featuredMovies.filter(movie => 
        movie.cinemaId === this.selectedCinema
      );
    }
  },
  methods: {
    closeDropdown(event) {
      if (!event.target.closest('.custom-dropdown')) {
        this.cinemaDropdownOpen = false
      }
    },
    toggleCinemaDropdown(event) {
      event.stopPropagation()
      this.cinemaDropdownOpen = !this.cinemaDropdownOpen
    },
    selectCinema(cinemaId, cinemaName) {
      this.selectedCinema = cinemaId
      this.selectedCinemaName = cinemaName
      this.cinemaDropdownOpen = false
    },
    async fetchCinemas() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        const [localCinemasResponse, theatreAreasResponse] = await Promise.all([
          fetch(`${apiUrl}/api/cinemas`).catch(() => null),
          fetch(`${apiUrl}/api/apollo-kino/TheatreAreas`).catch(() => null)
        ]);
        
        let allCinemas = [];
        
        if (localCinemasResponse && localCinemasResponse.ok) {
          const data = await localCinemasResponse.json();
          if (data.success && data.data) {
            allCinemas = data.data.map(cinema => ({
              _id: cinema._id,
              name: cinema.name
            }));
          }
        }
        
        if (theatreAreasResponse && theatreAreasResponse.ok) {
          const data = await theatreAreasResponse.json();
          if (data.success && data.data) {
            const theatreAreas = data.data.map(area => ({
              _id: area.ID,
              name: area.Name
            }));
            allCinemas = [...allCinemas, ...theatreAreas];
          }
        }
        
        this.cinemas = allCinemas;
      } catch (err) {
        console.error('Error fetching cinemas:', err);
      }
    },
    async fetchFeaturedMovies() {
      this.loading = true;
      this.error = null;
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/apollo-kino/events`);
        
        if (response.data.success) {
          this.featuredMovies = (response.data.movies || []).slice(0, 12);
        } else {
          this.error = 'Failed to load featured movies';
        }
      } catch (err) {
        console.error('Error fetching featured movies:', err);
        this.error = `Failed to load featured movies. Please make sure the backend is running.`;
      } finally {
        this.loading = false;
      }
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
  mounted() {
    this.fetchCinemas();
    this.fetchFeaturedMovies();
  }
}
</script>

<style scoped>
.home {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  min-height: calc(100vh - 200px);
}

.featured {
  padding: 3rem 0;
}

.container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Cinema Selector */
.cinema-selector-wrapper {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 2rem;
}

.custom-dropdown {
  position: relative;
  display: inline-block;
  z-index: 100;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 12px;
  background: linear-gradient(145deg, #e94560 0%, #c73e54 100%);
  color: #fff;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.3);
  min-width: 200px;
  justify-content: center;
}

.dropdown-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(233, 69, 96, 0.5);
  background: linear-gradient(145deg, #ff5a75 0%, #e94560 100%);
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
  left: 0;
  min-width: 100%;
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border: 1px solid rgba(233, 69, 96, 0.3);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 9999;
  overflow: hidden;
  animation: dropdownFadeInDown 0.2s ease;
  max-height: 400px;
  overflow-y: auto;
}

@keyframes dropdownFadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h2 {
  font-size: 2.5rem;
  color: #fff;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
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
}

.btn-view:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(233, 69, 96, 0.6);
  background: linear-gradient(135deg, #ff5a75 0%, #e94560 100%);
}

.movie-info {
  padding: 1.25rem;
}

.movie-info h3 {
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
}

.age-badge {
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

.view-all-container {
  text-align: center;
  margin-top: 3rem;
}

.btn-view-all {
  display: inline-block;
  background: transparent;
  color: #e94560;
  padding: 1rem 2.5rem;
  border: 2px solid #e94560;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.btn-view-all:hover {
  background: #e94560;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(233, 69, 96, 0.3);
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

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 30px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

@media (max-width: 768px) {
  .section-header h2 {
    font-size: 1.6rem;
  }
  
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
  }
  
  .movie-info {
    padding: 1rem;
  }
  
  .movie-info h3 {
    font-size: 1rem;
  }
}
</style>