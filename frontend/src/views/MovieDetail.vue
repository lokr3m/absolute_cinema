<template>
  <div class="movie-detail">
    <div class="container">
      <div class="movie-header">
        <div class="movie-poster">
          <img src="https://via.placeholder.com/400x600" alt="Movie Poster">
        </div>
        <div class="movie-info">
          <h1>Movie Title {{ $route.params.id }}</h1>
          <div class="meta">
            <span class="rating">⭐ 8.5/10</span>
            <span class="year">2024</span>
            <span class="duration">120 min</span>
            <span class="age-rating">PG-13</span>
          </div>
          <div class="genres">
            <span class="genre-tag">Action</span>
            <span class="genre-tag">Adventure</span>
            <span class="genre-tag">Sci-Fi</span>
          </div>
          <p class="description">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <div class="cast">
            <h3>Cast:</h3>
            <p>Actor 1, Actor 2, Actor 3</p>
          </div>
          <div class="director">
            <h3>Director:</h3>
            <p>Famous Director</p>
          </div>
          <router-link to="/booking" class="btn btn-primary">Book Tickets</router-link>
        </div>
      </div>

      <div class="showtimes">
        <h2>Showtimes</h2>
        <div class="date-selector">
          <button class="date-btn active">Today</button>
          <button class="date-btn">Tomorrow</button>
          <button class="date-btn">Wed</button>
          <button class="date-btn">Thu</button>
          <button class="date-btn">Fri</button>
        </div>
        <div class="cinema-showtimes">
          <div class="cinema" v-for="cinema in 3" :key="cinema">
            <h3>Cinema {{ cinema }}</h3>
            <div class="times">
              <button class="time-btn" v-for="time in ['10:00', '13:30', '16:45', '19:00', '21:30']" :key="time">
                {{ time }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="trailer">
        <h2>Trailer</h2>
        <div class="video-placeholder">
          <p>Trailer video would be embedded here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MovieDetail'
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
  margin-bottom: 1rem;
  color: #333;
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

.date-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.date-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.date-btn.active,
.date-btn:hover {
  background-color: #e50914;
  color: #fff;
  border-color: #e50914;
}

.cinema {
  margin-bottom: 1.5rem;
}

.cinema h3 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #333;
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
}

.time-btn:hover {
  background-color: #333;
  color: #fff;
  border-color: #333;
}

.trailer h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.video-placeholder {
  background: #000;
  height: 500px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .movie-header {
    grid-template-columns: 1fr;
  }
  
  .date-selector,
  .times {
    flex-wrap: wrap;
  }
}
</style>
