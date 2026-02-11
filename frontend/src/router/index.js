import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Movies from '../views/Movies.vue'
import MovieDetail from '../views/MovieDetail.vue'
import Booking from '../views/Booking.vue'
import Schedule from '../views/Schedule.vue'
import Admin from '../views/Admin.vue'
import News from '../views/News.vue'

const REQUIRED_BOOKING_QUERY = ['film', 'cinema', 'date', 'time']

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/movies',
    name: 'Movies',
    component: Movies
  },
  {
    path: '/movies/:id',
    name: 'MovieDetail',
    component: MovieDetail
  },
  {
    path: '/booking',
    name: 'Booking',
    component: Booking,
    beforeEnter: (to, from, next) => {
      const hasRequiredQuery = REQUIRED_BOOKING_QUERY.every(key => {
        const value = to.query[key]
        if (Array.isArray(value)) return false
        if (typeof value !== 'string') return false
        const trimmedValue = value.trim()
        return trimmedValue.length > 0 && trimmedValue === value
      })

      if (!hasRequiredQuery) {
        next({ name: 'Schedule' })
      } else {
        next()
      }
    }
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: Schedule
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin
  },
  {
    path: '/news',
    name: 'News',
    component: News
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
