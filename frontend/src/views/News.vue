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
            <img :src="getArticleImage(article)" :alt="article.Title">
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
    categoryMap() {
      // Create a map of category name to ID for O(1) lookups
      const map = {};
      this.categories.forEach(cat => {
        map[cat.Name] = cat.ID;
      });
      return map;
    },
    filteredNews() {
      if (this.selectedCategory === null) {
        return this.news;
      }
      
      return this.news.filter(article => {
        if (!article.Categories) return false;
        
        const categories = this.getArticleCategories(article.Categories);
        return categories.some(catName => {
          return this.categoryMap[catName] === this.selectedCategory;
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
    getArticleImage(article) {
      return article.ImageURL || 
             article.ThumbnailURL || 
             `https://via.placeholder.com/400x300/1a1a2e/e94560?text=${encodeURIComponent(article.Title)}`;
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
  background: #f5f5f5;
}

.page-header {
  background: linear-gradient(135deg, #0f0f0f 0%, #1f1f1f 50%, #0f0f0f 100%);
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
    linear-gradient(45deg, rgba(255, 102, 0, 0.12) 0%, transparent 50%),
    url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
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
  color: #d5d5d5;
  font-size: 1.2rem;
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
  background: #fff;
  border: 2px solid #ddd;
  color: #555;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.category-tab:hover {
  border-color: #ff6600;
  color: #ff6600;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-tab.active {
  background: #ff6600;
  border-color: #ff6600;
  color: #fff;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

.news-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;
}

.news-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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
  transform: scale(1.05);
}

.image-overlay {
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
  background: #ff6600;
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

.news-info {
  padding: 1.25rem;
}

.news-date {
  color: #7f8c8d;
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

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.category-tag {
  background: #fef5f3;
  color: #ff6600;
  padding: 0.3rem 0.7rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #fdd;
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