<template>
  <div class="news-page">
    <div class="page-header">
      <div class="container">
        <h1>📰 News & Updates</h1>
        <p class="subtitle">Stay updated with the latest cinema news</p>
      </div>
    </div>

    <div class="container">
      <!-- Category Filter -->
      <div class="filter-section" v-if="categories.length > 0">
        <div class="category-tabs">
          <button
            @click="selectedCategory = null"
            :class="['category-tab', { active: selectedCategory === null }]"
          >
            All News
          </button>
          <button
            v-for="category in categories"
            :key="category.ID"
            @click="selectedCategory = category.ID"
            :class="['category-tab', { active: selectedCategory === category.ID }]"
          >
            {{ category.Name }} ({{ category.NewsArticleCount }})
          </button>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading news...</p>
      </div>

      <div v-else-if="error" class="error">
        <span class="error-icon">⚠️</span>
        {{ error }}
      </div>

      <div v-else class="news-grid">
        <div
          class="news-card"
          v-for="(article, index) in filteredNews"
          :key="index"
        >
          <div class="news-image">
            <img :src="article.ImageURL || article.ThumbnailURL || 'https://via.placeholder.com/400x300/1a1a2e/e94560?text=' + encodeURIComponent(article.Title)" :alt="article.Title">
            <div class="image-overlay">
              <div class="overlay-content">
                <a
                  :href="article.ArticleURL || '#'"
                  target="_blank"
                  class="btn-view"
                >
                  <span>Read More</span>
                </a>
              </div>
            </div>
          </div>
          <div class="news-info">
            <div class="news-date">
              <span class="icon">📅</span>
              {{ formatDate(article.PublishDate) }}
            </div>
            <h3 class="news-title">{{ article.Title }}</h3>
            <div class="category-tags" v-if="article.Categories">
              <span 
                v-for="(category, idx) in getArticleCategories(article.Categories)" 
                :key="idx" 
                class="category-tag"
              >
                {{ category }}
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
  name: 'News',
  data() {
    return {
      news: [],
      categories: [],
      selectedCategory: null,
      loading: true,
      error: null,
    }
  },
  mounted() {
    this.getNewsCategories();
    this.getNews();
  },
  computed: {
    filteredNews() {
      if (this.selectedCategory === null) {
        return this.news;
      }
      
      return this.news.filter(article => {
        if (!article.Categories) return false;
        
        const categories = this.getArticleCategories(article.Categories);
        return categories.some(cat => {
          // Find matching category by ID
          const matchingCategory = this.categories.find(c => c.Name === cat);
          return matchingCategory && matchingCategory.ID === this.selectedCategory;
        });
      });
    }
  },
  methods: {
    getNewsCategories() {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      axios.get(`${apiUrl}/api/apollo-kino/NewsCategories`)
        .then(res => {
          this.categories = res.data.data || [];
        })
        .catch(err => {
          console.error('Error fetching news categories:', err);
        });
    },
    getNews() {
      this.loading = true;
      this.error = null;
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      axios.get(`${apiUrl}/api/apollo-kino/News`)
        .then(res => {
          this.news = res.data.data || [];
          this.loading = false;
        })
        .catch(err => {
          console.error('Error fetching news:', err);
          this.loading = false;
          this.error = `Cannot connect to the backend server. Please make sure the backend is running on ${apiUrl}`;
        });
    },
    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    getArticleCategories(categories) {
      if (!categories) return [];
      
      // Handle different possible structures
      if (categories.NewsArticleCategory) {
        const cats = Array.isArray(categories.NewsArticleCategory) 
          ? categories.NewsArticleCategory 
          : [categories.NewsArticleCategory];
        return cats.map(c => c.Name);
      }
      
      if (Array.isArray(categories)) {
        return categories.map(c => c.Name || c);
      }
      
      return [];
    }
  },
}
</script>

<style scoped>
.news-page {
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

.filter-section {
  margin-bottom: 2rem;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.category-tab {
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.category-tab:hover {
  background: linear-gradient(145deg, #252e50 0%, #1e2746 100%);
  border-color: rgba(233, 69, 96, 0.3);
  color: #fff;
  transform: translateY(-2px);
}

.category-tab.active {
  background: linear-gradient(135deg, #e94560 0%, #c73e54 100%);
  border-color: rgba(233, 69, 96, 0.5);
  color: #fff;
  box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

.news-card {
  background: linear-gradient(145deg, #1e2746 0%, #1a1f35 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.news-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 60px rgba(233, 69, 96, 0.2);
  border-color: rgba(233, 69, 96, 0.3);
}

.news-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4/3;
}

.news-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.news-card:hover .news-image img {
  transform: scale(1.1);
}

.image-overlay {
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
  justify-content: center;
  align-items: center;
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.news-card:hover .image-overlay {
  opacity: 1;
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

.news-info {
  padding: 1.25rem;
}

.news-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.news-date .icon {
  font-size: 0.9rem;
}

.news-title {
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

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.category-tag {
  background: rgba(233, 69, 96, 0.2);
  color: #e94560;
  padding: 0.3rem 0.7rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(233, 69, 96, 0.3);
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
  
  .news-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  
  .news-info {
    padding: 1rem;
  }
  
  .news-title {
    font-size: 1rem;
  }

  .category-tabs {
    justify-content: flex-start;
  }
}
</style>
