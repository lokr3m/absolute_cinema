import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Movies from '../views/Movies.vue'
import MovieDetail from '../views/MovieDetail.vue'
import Booking from '../views/Booking.vue'
import Schedule from '../views/Schedule.vue'
import Admin from '../views/Admin.vue'
import News from '../views/News.vue'

const REQUIRED_BOOKING_QUERY = ['film', 'cinema', 'date', 'time']
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/
const TIME_FORMAT = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const isNonEmptyString = value => value.length > 0

const isValidDateValue = value => {
  if (!DATE_FORMAT.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const targetDate = Date.UTC(year, month - 1, day)
  const date = new Date(targetDate)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return false
  }
  const now = Date.now()
  const today = new Date(now)
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  return targetDate >= todayUtc
}

const BOOKING_QUERY_VALIDATORS = {
  film: isNonEmptyString,
  cinema: isNonEmptyString,
  date: isValidDateValue,
  time: value => TIME_FORMAT.test(value)
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
    if (value === undefined || value === null) return false
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
