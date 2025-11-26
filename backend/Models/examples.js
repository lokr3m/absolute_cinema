// Example usage of the cinema database models
// This file demonstrates how to use the models in your application

const mongoose = require('mongoose');
const models = require('./');

// Example: Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/cinema');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Example: Create a new cinema
async function createCinema() {
  const cinema = await models.Cinema.create({
    name: 'Apollo Kino Solaris',
    address: {
      street: 'Estonia pst 9',
      city: 'Tallinn',
      postalCode: '10143',
      country: 'Estonia'
    },
    phone: '+372 680 9090',
    email: 'info@apollokino.ee',
    facilities: ['Parking', 'Cafe', '3D', 'IMAX']
  });
  console.log('Created cinema:', cinema.name);
  return cinema;
}

// Example: Create a hall in a cinema
async function createHall(cinemaId) {
  const hall = await models.Hall.create({
    cinema: cinemaId,
    name: 'Hall 1',
    capacity: 200,
    rows: 10,
    seatsPerRow: 20,
    screenType: 'IMAX',
    soundSystem: 'Dolby Atmos'
  });
  console.log('Created hall:', hall.name);
  return hall;
}

// Example: Create seats for a hall
async function createSeats(hallId, rows, seatsPerRow) {
  const seats = [];
  for (let row = 1; row <= rows; row++) {
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      // Make some seats VIP (last 2 rows)
      const seatType = row >= rows - 1 ? 'vip' : 'standard';
      seats.push({
        hall: hallId,
        row: row,
        number: seat,
        seatType: seatType
      });
    }
  }
  await models.Seat.insertMany(seats);
  console.log(`Created ${seats.length} seats`);
}

// Example: Create a film
async function createFilm() {
  const film = await models.Film.create({
    title: 'Inception',
    originalTitle: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    duration: 148,
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
    releaseDate: new Date('2010-07-16'),
    language: 'English',
    subtitles: ['Estonian', 'Russian'],
    ageRating: 'PG-13',
    posterUrl: 'https://example.com/inception-poster.jpg',
    trailerUrl: 'https://example.com/inception-trailer.mp4',
    rating: 8.8,
    isActive: true
  });
  console.log('Created film:', film.title);
  return film;
}

// Example: Create a session
async function createSession(filmId, hallId) {
  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 1); // Tomorrow
  startTime.setHours(19, 0, 0, 0); // 7 PM
  
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 148); // Film duration
  
  const session = await models.Session.create({
    film: filmId,
    hall: hallId,
    startTime: startTime,
    endTime: endTime,
    price: {
      standard: 8.50,
      vip: 12.00,
      student: 6.00,
      child: 5.00
    },
    is3D: false,
    subtitles: 'Estonian',
    availableSeats: 200,
    status: 'scheduled'
  });
  console.log('Created session at:', session.startTime);
  return session;
}

// Example: Create a user
async function createUser() {
  const user = await models.User.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'hashed_password_here', // In real app, hash with bcrypt
    phone: '+372 5555 5555',
    role: 'user'
  });
  console.log('Created user:', user.email);
  return user;
}

// Example: Create a booking
async function createBooking(userId, sessionId, seatIds) {
  const booking = await models.Booking.create({
    user: userId,
    session: sessionId,
    seats: seatIds,
    totalPrice: 17.00,
    bookingNumber: 'BK-' + Date.now(),
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    contactEmail: 'john.doe@example.com',
    contactPhone: '+372 5555 5555'
  });
  console.log('Created booking:', booking.bookingNumber);
  return booking;
}

// Example: Query with population
async function getBookingDetails(bookingId) {
  const booking = await models.Booking.findById(bookingId)
    .populate('user', 'firstName lastName email')
    .populate({
      path: 'session',
      populate: [
        { path: 'film', select: 'title duration genre' },
        { path: 'hall', select: 'name screenType soundSystem' }
      ]
    })
    .populate('seats', 'row number seatType');
  
  console.log('Booking details:', booking);
  return booking;
}

// Export functions for use in your application
module.exports = {
  connectDB,
  createCinema,
  createHall,
  createSeats,
  createFilm,
  createSession,
  createUser,
  createBooking,
  getBookingDetails
};

// Uncomment to run examples:
// (async () => {
//   await connectDB();
//   const cinema = await createCinema();
//   const hall = await createHall(cinema._id);
//   await createSeats(hall._id, 10, 20);
//   const film = await createFilm();
//   const session = await createSession(film._id, hall._id);
//   const user = await createUser();
//   const seats = await models.Seat.find({ hall: hall._id }).limit(2);
//   const booking = await createBooking(user._id, session._id, seats.map(s => s._id));
//   await getBookingDetails(booking._id);
//   process.exit(0);
// })();
