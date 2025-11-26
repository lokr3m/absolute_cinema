<template>
  <div v-if="loading" class="loading">
    Loading movies...
  </div>

  <div v-else-if="error" class="error">
    {{ error }}
  </div>

  <div v-else class="movie-grid">
    <div
      class="movie-card"
      v-for="(movie, index) in movies"
      :key="index"
    >
      <div class="movie-poster">
        <img :src="movie.posterUrl || 'https://via.placeholder.com/300x450/333/fff?text=No+Image'" :alt="movie.title">
        <div class="overlay">
          <router-link
            v-if="movie._id"
            :to="`/movies/${movie._id}`"
            class="btn"
          >
            View Details
          </router-link>

          <a
            v-else
            :href="movie.EventURL || '#'"
            target="_blank"
            class="btn"
          >
            View on Apollo Kino
          </a>
        </div>
      </div>
      <div class="movie-info">
        <h3>{{ movie.title }}</h3>
        <p class="genre">{{ Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre }}</p>
        <div class="meta">
          <span class="rating">⭐ {{ movie.rating || 'N/A' }}</span>
          <span class="duration">{{ movie.duration || 'N/A' }} min</span>
        </div>
        <p class="age-rating">{{ movie.ageRating }}</p>
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
  /*methods: {
    async fetchMovies() {
      this.loading = true;
      this.error = null;
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        // Fetch data from Apollo Kino Events API
        const eventsUrl = `${apiUrl}/api/apollo-kino/events`;
        const eventsResponse = await fetch(eventsUrl);
        
        if (!eventsResponse.ok) {
          throw new Error(`HTTP error! status: ${eventsResponse.status}`);
        }
        
        const eventsData = await eventsResponse.json();
        
        if (eventsData.success) {
          let movies = eventsData.data || [];
          
          // Apply filters if selected
          if (this.selectedGenre) {
            movies = movies.filter(movie => 
              movie.genre && Array.isArray(movie.genre) && movie.genre.includes(this.selectedGenre)
            );
          }
          
          if (this.selectedAgeRating) {
            movies = movies.filter(movie => 
              movie.ageRating === this.selectedAgeRating
            );
          }
          
          this.movies = movies;
        } else {
          this.error = 'Failed to load movies';
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
        this.error = `Failed to load movies from Apollo Kino API: ${err.message}. Make sure the backend server is running on http://localhost:3000`;
      } finally {
        this.loading = false;
      }
    }
  },*/
  mounted() {
    this.getMovies();
    // console.log('i am here')
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
          //console.log(this.movies)
        })
        .catch(err => {
          console.error('Error fetching movies:', err);
          this.loading = false;
          this.error = `Cannot connect to the backend server. Please make sure the backend is running on ${apiUrl}`;
        });
    }
  },
}
</script>

<style scoped>
.movies {
  padding: 3rem 0;
  min-height: calc(100vh - 200px);
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

.filters {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #333;
}

.filter-group select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}

.movie-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.movie-card:hover {
  transform: translateY(-5px);
}

.movie-poster {
  position: relative;
  overflow: hidden;
}

.movie-poster img {
  width: 100%;
  height: 350px;
  object-fit: cover;
  display: block;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.movie-card:hover .overlay {
  opacity: 1;
}

.overlay .btn {
  background-color: #e50914;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
}

.movie-info {
  padding: 1rem;
}

.movie-info h3 {
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 1.1rem;
}

.meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.rating {
  color: #f5c518;
  font-weight: 600;
}

.duration {
  color: #666;
}

.genre {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.age-rating {
  color: #e50914;
  font-size: 0.85rem;
  font-weight: 600;
}

.loading,
.error,
.no-movies {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
}

.error {
  color: #e50914;
}

.no-movies {
  color: #666;
}
</style>
