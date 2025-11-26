<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <h1>Welcome to Cinema</h1>
        <p>Experience the magic of movies</p>
        <router-link to="/movies" class="btn btn-primary">Browse Movies</router-link>
      </div>
    </section>

    <section class="featured">
      <div class="container">
        <h2>Now Showing</h2>
        
        <div v-if="loading" class="loading">
          Loading featured movies...
        </div>

        <div v-else-if="error" class="error">
          {{ error }}
        </div>

        <div v-else class="movie-grid">
          <div class="movie-card" v-for="movie in featuredMovies" :key="movie._id">
            <div class="movie-poster">
              <img :src="movie.posterUrl || 'https://via.placeholder.com/300x450/333/fff?text=No+Image'" :alt="movie.title">
            </div>
            <div class="movie-info">
              <h3>{{ movie.title }}</h3>
              <p class="genre">{{ movie.genre.join(', ') }}</p>
              <div class="meta">
                <span class="rating">⭐ {{ movie.rating || 'N/A' }}</span>
                <span class="duration">{{ movie.duration }} min</span>
              </div>
              <router-link :to="`/movies/${movie._id}`" class="btn btn-secondary">View Details</router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      featuredMovies: [],
      loading: false,
      error: null
    }
  },
  methods: {
    async fetchFeaturedMovies() {
      this.loading = true;
      this.error = null;
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/films?limit=6`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          this.featuredMovies = data.data || [];
        } else {
          this.error = 'Failed to load featured movies';
        }
      } catch (err) {
        console.error('Error fetching featured movies:', err);
        this.error = `Failed to load featured movies: ${err.message}`;
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.fetchFeaturedMovies();
  }
}
</script>

<style scoped>
.hero {
  background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
    url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600') center/cover;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero-content p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
}

.featured {
  padding: 4rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.featured h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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

.movie-poster img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.movie-info {
  padding: 1rem;
}

.movie-info h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.genre {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.rating {
  color: #f5c518;
  font-weight: 600;
}

.duration {
  color: #666;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
}

.error {
  color: #e50914;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background-color: #e50914;
  color: #fff;
}

.btn-primary:hover {
  background-color: #c00812;
}

.btn-secondary {
  background-color: #333;
  color: #fff;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

.btn-secondary:hover {
  background-color: #555;
}
</style>
