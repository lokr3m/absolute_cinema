import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Movies from '../views/Movies.vue'
import MovieDetail from '../views/MovieDetail.vue'
import Booking from '../views/Booking.vue'
import Schedule from '../views/Schedule.vue'
import Admin from '../views/Admin.vue'
import News from '../views/News.vue'

const REQUIRED_BOOKING_QUERY = ['film', 'cinema', 'date', 'time']
const BOOKING_QUERY_VALIDATORS = {
  film: value => value.length > 0,
  cinema: value => value.length > 0,
  date: value => /^\d{4}-\d{2}-\d{2}$/.test(value),
  time: value => /^\d{2}:\d{2}$/.test(value)
}

const isValidBookingQueryValue = (key, value) => {
  if (typeof value !== 'string') return false
  const trimmedValue = value.trim()
  if (!trimmedValue) return false
  const validator = BOOKING_QUERY_VALIDATORS[key]
  return validator ? validator(trimmedValue) : true
}

const hasValidBookingQuery = to =>
  REQUIRED_BOOKING_QUERY.every(key => {
    const value = to.query[key]
    if (Array.isArray(value)) return false
    return isValidBookingQueryValue(key, value)
  })

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
      if (!hasValidBookingQuery(to)) {
        alert('Please choose a session from the Schedule page to start booking.')
        next({ name: 'Schedule' })
        return
      }

      next()
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
