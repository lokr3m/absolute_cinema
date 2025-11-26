<template>
  <div class="admin">
    <div class="container">
      <h1>Admin Dashboard</h1>
      
      <div class="admin-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="admin-content">
        <!-- Movies Management -->
        <div v-if="activeTab === 'movies'" class="tab-content">
          <div class="section-header">
            <h2>Manage Movies</h2>
            <button class="btn btn-primary">Add New Movie</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Genre</th>
                <th>Duration</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 5" :key="i">
                <td>{{ i }}</td>
                <td>Movie Title {{ i }}</td>
                <td>Action, Adventure</td>
                <td>120 min</td>
                <td>⭐ 8.5</td>
                <td class="actions">
                  <button class="btn-icon edit">✏️</button>
                  <button class="btn-icon delete">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sessions Management -->
        <div v-if="activeTab === 'sessions'" class="tab-content">
          <div class="section-header">
            <h2>Manage Sessions</h2>
            <button class="btn btn-primary">Add New Session</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Movie</th>
                <th>Cinema</th>
                <th>Date</th>
                <th>Time</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 8" :key="i">
                <td>{{ i }}</td>
                <td>Movie Title {{ i }}</td>
                <td>Cinema {{ (i % 3) + 1 }}</td>
                <td>2024-10-{{ 25 + (i % 5) }}</td>
                <td>{{ ['10:00', '13:30', '16:45', '19:00', '21:30'][i % 5] }}</td>
                <td>€9.50</td>
                <td class="actions">
                  <button class="btn-icon edit">✏️</button>
                  <button class="btn-icon delete">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bookings Management -->
        <div v-if="activeTab === 'bookings'" class="tab-content">
          <div class="section-header">
            <h2>Manage Bookings</h2>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Movie</th>
                <th>Date</th>
                <th>Seats</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 10" :key="i">
                <td>{{ i }}</td>
                <td>Customer {{ i }}</td>
                <td>Movie Title {{ i }}</td>
                <td>2024-10-{{ 25 + (i % 5) }}</td>
                <td>{{ i % 3 + 1 }} seats</td>
                <td>€{{ (9.50 * (i % 3 + 1)).toFixed(2) }}</td>
                <td>
                  <span class="status-badge" :class="i % 2 === 0 ? 'confirmed' : 'pending'">
                    {{ i % 2 === 0 ? 'Confirmed' : 'Pending' }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-icon view">👁️</button>
                  <button class="btn-icon delete">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cinemas Management -->
        <div v-if="activeTab === 'cinemas'" class="tab-content">
          <div class="section-header">
            <h2>Manage Cinemas</h2>
            <button class="btn btn-primary">Add New Cinema</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Location</th>
                <th>Halls</th>
                <th>Total Seats</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 3" :key="i">
                <td>{{ i }}</td>
                <td>Cinema {{ i }}</td>
                <td>Location {{ i }}, Tallinn</td>
                <td>{{ 3 + i }}</td>
                <td>{{ 200 + (i * 50) }}</td>
                <td class="actions">
                  <button class="btn-icon edit">✏️</button>
                  <button class="btn-icon delete">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Admin',
  data() {
    return {
      activeTab: 'movies',
      tabs: [
        { id: 'movies', label: 'Movies' },
        { id: 'sessions', label: 'Sessions' },
        { id: 'bookings', label: 'Bookings' },
        { id: 'cinemas', label: 'Cinemas' }
      ]
    }
  }
}
</script>

<style scoped>
.admin {
  padding: 3rem 0;
  min-height: calc(100vh - 200px);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #333;
}

.admin-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #ddd;
}

.tab-btn {
  padding: 1rem 2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  color: #333;
}

.tab-btn.active {
  color: #e50914;
  border-bottom-color: #e50914;
}

.admin-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.8rem;
  color: #333;
}

.btn-primary {
  background-color: #e50914;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #c00812;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f5f5f5;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  font-weight: 600;
  color: #333;
}

.data-table tbody tr:hover {
  background: #f9f9f9;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s ease;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-badge.confirmed {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

@media (max-width: 768px) {
  .admin-tabs {
    overflow-x: auto;
  }
  
  .data-table {
    font-size: 0.9rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>
