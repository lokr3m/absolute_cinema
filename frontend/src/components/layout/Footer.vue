<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Cinema</h3>
          <p>Your premier destination for movies</p>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/movies">Movies</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Contact</h4>
          <p>Email: info@cinema.com</p>
          <p>Phone: +372 1234 5678</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 Cinema. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
.footer {
  background-color: #000;
  color: #ecf0f1;
  padding: 2rem 0 1rem;
  margin-top: auto;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
  margin-bottom: 1rem;
  color: #ff6600;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #bdc3c7;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: #ff6600;
}

.footer-section p {
  color: #bdc3c7;
  margin: 0.5rem 0;
}

.footer-bottom {
  border-top: 1px solid #222;
  padding-top: 1rem;
  text-align: center;
  color: #95a5a6;
}
</style>
