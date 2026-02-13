<template>
  <div class="movies-page">
    <div class="page-header">
      <div class="container">
        <h1>🎬 All Movies</h1>
        <p class="subtitle">Discover our complete collection of films</p>
      </div>
    </div>

    <div class="container">
      <!-- Search and Filters Section - All in One Block -->
      <div v-if="!loading && !error" class="filters-section">
        <div class="filters-row-unified">
          <!-- Search Input -->
          <div class="filter-group filter-group-search">
            <label class="filter-label">Search</label>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="🔍 Search by title..."
              class="search-input-inline"
            />
          </div>

          <!-- Genre Filter -->
          <div class="filter-group">
            <label class="filter-label">Genre</label>
            <div class="custom-dropdown" :class="{ open: genreDropdownOpen }">
              <button class="dropdown-btn" @click="toggleGenreDropdown">
                <span>{{ selectedGenre || 'All' }}</span>
                <span class="arrow">▼</span>
              </button>
              <div class="dropdown-menu" v-if="genreDropdownOpen">
                <div 
                  class="dropdown-item" 
                  :class="{ active: selectedGenre === '' }"
                  @click="selectGenre('')"
                >
                  All Genres
                </div>
                <div 
                  v-for="genre in availableGenres" 
                  :key="genre" 
                  class="dropdown-item"
                  :class="{ active: selectedGenre === genre }"
                  @click="selectGenre(genre)"
                >
                  {{ genre }}
                </div>
              </div>
            </div>
          </div>

          <!-- Age Rating Filter -->
          <div class="filter-group">
            <label class="filter-label">Age Rating</label>
            <div class="custom-dropdown" :class="{ open: ageRatingDropdownOpen }">
              <button class="dropdown-btn" @click="toggleAgeRatingDropdown">
                <span>{{ selectedAgeRating || 'All' }}</span>
                <span class="arrow">▼</span>
              </button>
              <div class="dropdown-menu" v-if="ageRatingDropdownOpen">
                <div 
                  class="dropdown-item" 
                  :class="{ active: selectedAgeRating === '' }"
                  @click="selectAgeRating('')"
                >
                  All Ratings
                </div>
                <div 
                  v-for="rating in availableAgeRatings" 
                  :key="rating" 
                  class="dropdown-item"
                  :class="{ active: selectedAgeRating === rating }"
                  @click="selectAgeRating(rating)"
                >
                  {{ rating }}
                </div>
              </div>
            </div>
          </div>

          <!-- Sort Filter -->
          <div class="filter-group">
            <label class="filter-label">Sort By</label>
            <div class="custom-dropdown" :class="{ open: sortDropdownOpen }">
              <button class="dropdown-btn" @click="toggleSortDropdown">
                <span>{{ sortOptions.find(o => o.value === sortBy)?.label || 'Title' }}</span>
                <span class="arrow">▼</span>
              </button>
              <div class="dropdown-menu" v-if="sortDropdownOpen">
                <div 
                  v-for="option in sortOptions" 
                  :key="option.value" 
                  class="dropdown-item"
                  :class="{ active: sortBy === option.value }"
                  @click="selectSort(option.value)"
                >
                  {{ option.label }}
                </div>
              </div>
            </div>
          </div>

          <!-- Clear Filters Button -->
          <div class="filter-group filter-group-action">
            <label class="filter-label">&nbsp;</label>
            <button class="clear-filters-btn" @click="clearAllFilters" :disabled="!hasActiveFilters">
              <span class="clear-icon">✕</span>
              Clear Filters
            </button>
          </div>

          <!-- Results count -->
          <div class="results-info">
            <span class="results-count">{{ filteredMovies.length }} movie{{ filteredMovies.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading movies...</p>
      </div>

      <div v-else-if="error" class="error">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <div v-else-if="filteredMovies.length === 0" class="no-results">
        <span class="no-results-icon">🎬</span>
        <p>No movies found matching your search criteria</p>
      </div>

      <div v-else class="movie-grid">
        <div
          class="movie-card"
          v-for="(movie, index) in filteredMovies"
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
                  v-if="movie.apolloKinoId || movie._id"
                  :to="`/movies/${movie.apolloKinoId || movie._id}`"
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
      searchQuery: '',
      selectedGenre: '',
      selectedAgeRating: '',
      sortBy: 'title',
      genreDropdownOpen: false,
      ageRatingDropdownOpen: false,
      sortDropdownOpen: false,
      sortOptions: [
        { value: 'title', label: 'Title (A-Z)' },
        { value: 'title-desc', label: 'Title (Z-A)' },
        { value: 'rating', label: 'Rating (High to Low)' },
        { value: 'duration', label: 'Duration' }
      ]
    }
  },
  computed: {
    availableGenres() {
      const genres = new Set();
      this.movies.forEach(movie => {
        if (Array.isArray(movie.genre)) {
          movie.genre.forEach(g => genres.add(g));
        } else if (movie.genre) {
          genres.add(movie.genre);
        }
      });
      return Array.from(genres).sort();
    },
    availableAgeRatings() {
      const ratings = new Set();
      this.movies.forEach(movie => {
        if (movie.ageRating) {
          ratings.add(movie.ageRating);
        }
      });
      return Array.from(ratings).sort();
    },
    hasActiveFilters() {
      return this.searchQuery !== '' || 
             this.selectedGenre !== '' || 
             this.selectedAgeRating !== '' ||
             this.sortBy !== 'title';
    },
    filteredMovies() {
      let filtered = [...this.movies];
      
      // Apply search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(movie => 
          movie.title.toLowerCase().includes(query)
        );
      }
      
      // Apply genre filter
      if (this.selectedGenre) {
        filtered = filtered.filter(movie => {
          if (Array.isArray(movie.genre)) {
            return movie.genre.includes(this.selectedGenre);
          }
          return movie.genre === this.selectedGenre;
        });
      }
      
      // Apply age rating filter
      if (this.selectedAgeRating) {
        filtered = filtered.filter(movie => 
          movie.ageRating === this.selectedAgeRating
        );
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'duration':
            return (b.duration || 0) - (a.duration || 0);
          default:
            return 0;
        }
      });
      
      return filtered;
    }
  },
  mounted() {
    this.getMovies();
    // Close dropdowns when clicking outside
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
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
          // For demo purposes, show sample data when backend is unavailable
          this.movies = this.getSampleMovies();
          this.error = null; // Clear error to show the filters
        });
    },
    getSampleMovies() {
      return [
        {
          title: 'The Matrix',
          genre: ['Action', 'Sci-Fi'],
          duration: 136,
          rating: 8.7,
          ageRating: 'R',
          posterUrl: 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=The+Matrix',
          _id: 'sample1'
        },
        {
          title: 'Inception',
          genre: ['Action', 'Thriller'],
          duration: 148,
          rating: 8.8,
          ageRating: 'PG-13',
          posterUrl: 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=Inception',
          _id: 'sample2'
        },
        {
          title: 'The Shawshank Redemption',
          genre: ['Drama'],
          duration: 142,
          rating: 9.3,
          ageRating: 'R',
          posterUrl: 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=Shawshank',
          _id: 'sample3'
        },
        {
          title: 'Pulp Fiction',
          genre: ['Crime', 'Drama'],
          duration: 154,
          rating: 8.9,
          ageRating: 'R',
          posterUrl: 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=Pulp+Fiction',
          _id: 'sample4'
        },
        {
          title: 'The Dark Knight',
          genre: ['Action', 'Crime'],
          duration: 152,
          rating: 9.0,
          ageRating: 'PG-13',
          posterUrl: 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=Dark+Knight',
          _id: 'sample5'
        },
        {
          title: 'Forrest Gump',
          genre: ['Drama', 'Romance'],
          duration: 142,
          rating: 8.8,
          ageRating: 'PG-13',
          posterUrl: 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=Forrest+Gump',
          _id: 'sample6'
        },
        {
          title: 'The Godfather',
          genre: ['Crime', 'Drama'],
          duration: 175,
          rating: 9.2,
          ageRating: 'R',
          posterUrl: 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=Godfather',
          _id: 'sample7'
        },
        {
          title: 'Interstellar',
          genre: ['Sci-Fi', 'Drama'],
          duration: 169,
          rating: 8.6,
          ageRating: 'PG-13',
          posterUrl: 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=Interstellar',
          _id: 'sample8'
        }
      ];
    },
    toggleGenreDropdown() {
      this.genreDropdownOpen = !this.genreDropdownOpen;
      this.ageRatingDropdownOpen = false;
      this.sortDropdownOpen = false;
    },
    toggleAgeRatingDropdown() {
      this.ageRatingDropdownOpen = !this.ageRatingDropdownOpen;
      this.genreDropdownOpen = false;
      this.sortDropdownOpen = false;
    },
    toggleSortDropdown() {
      this.sortDropdownOpen = !this.sortDropdownOpen;
      this.genreDropdownOpen = false;
      this.ageRatingDropdownOpen = false;
    },
    selectGenre(genre) {
      this.selectedGenre = genre;
      this.genreDropdownOpen = false;
    },
    selectAgeRating(rating) {
      this.selectedAgeRating = rating;
      this.ageRatingDropdownOpen = false;
    },
    selectSort(sortValue) {
      this.sortBy = sortValue;
      this.sortDropdownOpen = false;
    },
    clearAllFilters() {
      this.searchQuery = '';
      this.selectedGenre = '';
      this.selectedAgeRating = '';
      this.sortBy = 'title';
    },
    handleClickOutside(event) {
      const target = event.target;
      if (!target.closest('.custom-dropdown')) {
        this.genreDropdownOpen = false;
        this.ageRatingDropdownOpen = false;
        this.sortDropdownOpen = false;
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

/* Search and Filters Section */
.filters-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
}

.filters-row-unified {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
}

.filter-group-search {
  flex: 1;
  min-width: 250px;
}

.filter-group-action {
  min-width: 160px;
}

.search-input-inline {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: #fafafa;
  font-weight: 500;
}

.search-input-inline:focus {
  outline: none;
  border-color: #ff6600;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
}

.search-input-inline::placeholder {
  color: #95a5a6;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clear-filters-btn {
  background: linear-gradient(135deg, #ff6600 0%, #e65c00 100%);
  color: #fff;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  width: 100%;
  box-shadow: 0 2px 8px rgba(255, 102, 0, 0.25);
}

.clear-filters-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 102, 0, 0.35);
}

.clear-filters-btn:active:not(:disabled) {
  transform: translateY(0);
}

.clear-filters-btn:disabled {
  background: #ddd;
  color: #999;
  cursor: not-allowed;
  box-shadow: none;
}

.clear-filters-btn .clear-icon {
  font-size: 1.1rem;
  font-weight: 700;
}

.results-info {
  display: flex;
  align-items: center;
  margin-left: auto;
  padding: 0.75rem 0;
}

.results-count {
  color: #7f8c8d;
  font-size: 0.9rem;
  font-weight: 500;
}

.custom-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-btn {
  background: #fff;
  border: 2px solid #e8e8e8;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  color: #2c3e50;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.dropdown-btn:hover {
  border-color: #ff6600;
  background: #fafafa;
}

.dropdown-btn .arrow {
  font-size: 0.7rem;
  transition: transform 0.3s ease;
  margin-left: 0.5rem;
}

.custom-dropdown.open .arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
  animation: dropdownFadeIn 0.2s ease;
}

@keyframes dropdownFadeIn {
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
  padding: 0.75rem 1rem;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: #fef5f3;
  color: #ff6600;
}

.dropdown-item.active {
  background: #fef5f3;
  color: #ff6600;
  font-weight: 600;
}

.results-info {
  display: flex;
  align-items: center;
  margin-left: auto;
  padding: 0.75rem 0;
}

.results-count {
  color: #7f8c8d;
  font-size: 0.9rem;
  font-weight: 500;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: #f9f9f9;
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
  color: #7f8c8d;
  text-align: center;
}

.no-results-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-results p {
  font-size: 1.1rem;
  margin: 0;
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
  
  .filters-row-unified {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group,
  .filter-group-search,
  .filter-group-action {
    min-width: 100%;
  }
  
  .results-info {
    margin-left: 0;
    justify-content: center;
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
