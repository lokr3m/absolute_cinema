<template>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <router-link to="/" class="logo">
          <h1>Cinema</h1>
        </router-link>
        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle navigation"
          @click="toggleMobileMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav class="nav">
          <div class="nav-links" :class="{ open: mobileMenuOpen }">
            <router-link to="/" class="nav-link" @click="closeMobileMenu">Home</router-link>
            <router-link to="/movies" class="nav-link" @click="closeMobileMenu">Movies</router-link>
            <router-link to="/schedule" class="nav-link" @click="closeMobileMenu">Schedule</router-link>
            <router-link to="/news" class="nav-link" @click="closeMobileMenu">News</router-link>
            <router-link to="/admin" class="nav-link" @click="closeMobileMenu">Admin</router-link>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header',
  data() {
    return {
      mobileMenuOpen: false
    }
  },
  watch: {
    $route() {
      this.mobileMenuOpen = false
    }
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false
    }
  }
}
</script>

<style scoped>
.header {
  background-color: #0a0a0a;
  padding: 0.95rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid #222;
  position: sticky;
  top: 0;
  z-index: 200;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.logo {
  text-decoration: none;
  color: #fff;
}

.logo h1 {
  margin: 0;
  font-size: 1.65rem;
  font-weight: bold;
  color: #ff6600;
  letter-spacing: 0.02em;
}

.nav {
  position: relative;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.menu-toggle {
  display: none;
  border: 1px solid #343434;
  border-radius: 10px;
  background: #141414;
  width: 46px;
  height: 40px;
  padding: 0.5rem;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.menu-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background: #f5f5f5;
  border-radius: 999px;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s ease;
  padding: 0.5rem 0;
  font-weight: 500;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #ff6600;
}

@media (max-width: 900px) {
  .header-content {
    justify-content: flex-start;
  }

  .menu-toggle {
    display: flex;
    margin-left: auto;
  }

  .nav-links {
    position: absolute;
    top: calc(100% + 14px);
    right: 0;
    width: min(78vw, 300px);
    background: #111;
    border: 1px solid #262626;
    border-radius: 12px;
    padding: 0.6rem;
    box-shadow: 0 18px 28px rgba(0, 0, 0, 0.4);
    display: none;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-links.open {
    display: flex;
  }

  .nav-link {
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
  }

  .nav-link:hover,
  .nav-link.router-link-active {
    background: rgba(255, 102, 0, 0.15);
  }
}

@media (max-width: 480px) {
  .logo h1 {
    font-size: 1.4rem;
  }

  .container {
    padding: 0 0.8rem;
  }
}
</style>
