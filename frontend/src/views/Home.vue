<template>
  <div class="home">
    <!-- Hero Banner -->
    <section class="hero-banner">
      <div class="hero-overlay">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">🎬 Welcome to Cinema</h1>
            <p class="hero-subtitle">Experience the Magic of Movies</p>
            <p class="hero-description">Discover the latest blockbusters, timeless classics, and everything in between</p>
          </div>
        </div>
      </div>
    </section>

    <section class="news-banner-section">
      <div class="container">
        <div class="section-header">
          <h2>Latest News</h2>
          <p class="section-subtitle">Fresh updates from Absolute Cinema</p>
        </div>

        <div class="news-banner-wrapper">
          <router-link :to="activeBanner.link" class="news-banner-card">
            <div class="news-banner-image">
              <img :src="activeBanner.imageUrl" :alt="activeBanner.title">
            </div>
            <div class="news-banner-content">
              <span class="news-banner-tag">News</span>
              <h3>{{ activeBanner.title }}</h3>
              <p>{{ activeBanner.description }}</p>
              <span class="news-banner-cta">Read more →</span>
            </div>
          </router-link>
          <div class="banner-controls">
            <button
              v-for="(banner, index) in newsBanners"
              :key="banner.id"
              class="banner-dot"
              :class="{ active: index === activeBannerIndex }"
              type="button"
              :aria-label="`Show banner ${index + 1}`"
              @click="selectBanner(index)"
            ></button>
          </div>
        </div>
      </div>
    </section>

    <section class="featured">
      <div class="container">
        <div class="section-header">
          <h2>Top Films</h2>
        </div>
        
        <div class="section-box">
          <div v-if="loading" class="loading">
            <div class="loading-spinner"></div>
            <p>Loading featured movies...</p>
          </div>

          <div v-else-if="error" class="error">
            <span class="error-icon">⚠️</span>
            {{ error }}
          </div>

          <div v-else class="movie-grid">
            <div class="movie-card" v-for="movie in topMovies" :key="movie._id || movie.title">
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
      </div>
    </section>

    <section class="featured genre-section">
      <div class="container">
        <div class="section-header">
          <h2>Genres</h2>
        </div>

        <div class="section-box">
          <div v-if="loading" class="loading">
            <div class="loading-spinner"></div>
            <p>Loading genres...</p>
          </div>

          <div v-else-if="error" class="error">
            <span class="error-icon">⚠️</span>
            {{ error }}
          </div>

          <div v-else class="genre-grid">
            <div class="genre-card" v-for="genre in featuredGenres.slice(0, 5)" :key="genre.key">
              <div class="genre-image">
                <img :src="genre.imageUrl" :alt="`${genre.name} genre`">
              </div>
              <div class="genre-card-content">
                <span class="genre-icon">🎞️</span>
                <h3>{{ genre.name }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios'

const HAS_UPPERCASE_REGEX = /[A-Z]/;
const HAS_LOWERCASE_REGEX = /[a-z]/;
// Matches word boundaries: start of string, spaces, hyphens, slashes, or apostrophes.
const TITLE_CASE_BOUNDARY_REGEX = /(^|[\s-\/'])([a-z])/g;
const GENRE_PLACEHOLDER_BASE = 'https://via.placeholder.com/320x180/1a1a2e/e94560?text=';
const TOP_MOVIE_COUNT = 5;
const DEFAULT_NEWS_BANNER = {
  id: 'default-banner',
  link: '/news',
  imageUrl: 'https://via.placeholder.com/1200x600/1a1a2e/e94560?text=Latest+News',
  title: 'Latest Cinema News',
  description: 'Stay tuned for the latest updates from Absolute Cinema.'
};

export default {
  name: 'Home',
  data() {
    return {
      topMovies: [],
      newsBanners: [
        {
          id: 'premiere-week',
          title: 'Premiere Week Highlights',
          description: 'Catch the biggest premieres with director Q&As all week long.',
          imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
          link: '/news'
        },
        {
          id: 'family-funday',
          title: 'Family Fun Day Returns',
          description: 'Discounted tickets and complimentary snacks for families every Saturday.',
          imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
          link: '/news'
        },
        {
          id: 'classic-series',
          title: 'Classic Cinema Series',
          description: 'Rediscover timeless masterpieces in restored 4K glory on the big screen.',
          imageUrl: 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1200&q=80',
          link: '/news'
        },
        {
          id: 'festival-pass',
          title: 'Festival Passes On Sale',
          description: 'Secure your seat for the Absolute Cinema Film Festival this spring.',
          imageUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=1200&q=80',
          link: '/news'
        },
        {
          id: 'late-night',
          title: 'Late Night Screenings',
          description: 'Stay up late with cult classics, midnight premieres, and themed snacks.',
          imageUrl: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&q=80',
          link: '/news'
        }
      ],
      activeBannerIndex: 0,
      loading: false,
      error: null
    }
  },
  computed: {
    activeBanner() {
      return this.newsBanners[this.activeBannerIndex] || DEFAULT_NEWS_BANNER;
    },
    featuredGenres() {
      const genres = new Map();

      this.topMovies.forEach(movie => {
        const movieGenres = Array.isArray(movie.genre)
          ? movie.genre
          : typeof movie.genre === 'string'
            ? movie.genre.split(',')
            : [];
        const posterUrl = movieGenres.length ? this.getMoviePosterUrl(movie) : '';

        movieGenres.forEach(genre => {
          const displayName = this.normalizeGenreName(genre);
          if (!displayName) return;
          const key = displayName.toLowerCase();
          const existing = genres.get(key);
          if (existing) {
            existing.count += 1;
            if (!existing.imageUrl && posterUrl) {
              existing.imageUrl = posterUrl;
            }
          } else {
            genres.set(key, { key, name: displayName, count: 1, imageUrl: posterUrl });
          }
        });
      });

      return Array.from(genres.values())
        .map(genre => ({
          ...genre,
          imageUrl: genre.imageUrl || `${GENRE_PLACEHOLDER_BASE}${encodeURIComponent(genre.name)}`
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }
  },
  methods: {
    getMoviePosterUrl(movie) {
      return movie?.posterUrl || movie?.PosterUrl || movie?.Images?.EventMediumImagePortrait || '';
    },
    getRandomMovies(movies, count) {
      const pool = Array.isArray(movies) ? [...movies] : [];
      const limit = Math.min(count, pool.length);
      for (let i = 0; i < limit; i += 1) {
        const swapIndex = i + Math.floor(Math.random() * (pool.length - i));
        [pool[i], pool[swapIndex]] = [pool[swapIndex], pool[i]];
      }
      return pool.slice(0, count);
    },
    normalizeGenreName(genre) {
      if (genre === null || genre === undefined) return '';
      const trimmed = String(genre).trim();
      if (!trimmed) return '';
      // Preserve acronyms like IMAX or 3D.
      if (HAS_UPPERCASE_REGEX.test(trimmed) && !HAS_LOWERCASE_REGEX.test(trimmed)) {
        return trimmed;
      }
      return trimmed
        .toLowerCase()
        // Title-case words separated by spaces, hyphens, slashes, or apostrophes.
        .replace(TITLE_CASE_BOUNDARY_REGEX, (match, spacer, char) => `${spacer}${char.toUpperCase()}`);
    },
    selectBanner(index) {
      if (index >= 0 && index < this.newsBanners.length) {
        this.activeBannerIndex = index;
      }
    },
    async fetchFeaturedMovies() {
      this.loading = true;
      this.error = null;
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await axios.get(`${apiUrl}/api/apollo-kino/events`);
        
        if (response.data.success) {
          this.topMovies = this.getRandomMovies(response.data.movies || [], TOP_MOVIE_COUNT);
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
    this.fetchFeaturedMovies();
  }
}
</script>

<style scoped>
.home {
  background: #f5f5f5;
  min-height: calc(100vh - 200px);
}

/* Hero Banner */
.hero-banner {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  position: relative;
  overflow: hidden;
}

.hero-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(45deg, rgba(255, 102, 0, 0.1) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
}

.hero-overlay {
  position: relative;
  z-index: 1;
  padding: 4rem 0;
}

.hero-content {
  text-align: center;
  color: #fff;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff 0%, #ff6600 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(255, 102, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #ff6600;
}

.hero-description {
  font-size: 1.1rem;
  color: #e0e0e0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.featured {
  padding: 3rem 0;
}

.container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.news-banner-section {
  padding: 3rem 0 0;
}

.section-subtitle {
  color: #7f8c8d;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.news-banner-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.news-banner-card {
  display: grid;
  grid-template-columns: minmax(220px, 40%) 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.news-banner-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

.news-banner-image {
  border-radius: 14px;
  overflow: hidden;
  min-height: 180px;
}

.news-banner-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.news-banner-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
}

.news-banner-tag {
  align-self: flex-start;
  background: #fef5f3;
  color: #ff6600;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.news-banner-content h3 {
  margin: 0;
  font-size: 1.6rem;
  color: #2c3e50;
}

.news-banner-content p {
  margin: 0;
  color: #7f8c8d;
  line-height: 1.6;
}

.news-banner-cta {
  font-weight: 600;
  color: #ff6600;
}

.banner-controls {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.banner-dot {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: none;
  background: #dcdcdc;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease;
}

.banner-dot.active {
  background: #ff6600;
  transform: scale(1.1);
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-box {
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #eee;
}

.section-header h2 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.genre-section {
  padding-bottom: 3rem;
}

.genre-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.25rem;
}

.genre-card {
  background: #fff;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}

.genre-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.genre-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem 1.5rem;
}

.genre-image {
  width: 100%;
  height: 120px;
  overflow: hidden;
}

.genre-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.genre-icon {
  font-size: 2rem;
}

.genre-card-content h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #2c3e50;
  font-weight: 600;
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
  padding: 0.9rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.btn-view:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.5);
  background: #e65c00;
}

.movie-info {
  padding: 1rem;
}

.movie-info h3 {
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
}

.age-badge {
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

.view-all-container {
  text-align: center;
  margin-top: 2.5rem;
}

.btn-view-all {
  display: inline-block;
  background: #fff;
  color: #ff6600;
  padding: 1rem 2.5rem;
  border: 2px solid #ff6600;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.btn-view-all:hover {
  background: #ff6600;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
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

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
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

  .news-banner-card {
    grid-template-columns: 1fr;
  }

  .news-banner-image {
    min-height: 160px;
  }
  
  .movie-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.9rem;
  }

  .genre-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.9rem;
  }
  
  .movie-info {
    padding: 1rem;
  }
  
  .movie-info h3 {
    font-size: 1rem;
  }
}
</style>