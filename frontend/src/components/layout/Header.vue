<template>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <router-link to="/" class="logo">
          <h1>Cinema</h1>
        </router-link>
        <nav class="nav">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/movies" class="nav-link">Movies</router-link>
          <router-link to="/schedule" class="nav-link">Schedule</router-link>
          <router-link to="/news" class="nav-link">News</router-link>
          <router-link to="/booking" class="nav-link">Booking</router-link>
          <router-link to="/admin" class="nav-link">Admin</router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header'
}
</script>

<style scoped>
.header {
  background-color: #1a1a1a;
  padding: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
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
}

.logo {
  text-decoration: none;
  color: #fff;
}

.logo h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  color: #e50914;
}

.nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s ease;
  padding: 0.5rem 0;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #e50914;
}
</style>
