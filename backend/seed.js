require('dotenv').config();
const mongoose = require('mongoose');
const { User, Cinema, Hall, Film, Session, Seat, Booking } = require('./Models');

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Cinema.deleteMany({});
    await Hall.deleteMany({});
    await Film.deleteMany({});
    await Session.deleteMany({});
    await Seat.deleteMany({});
    await Booking.deleteMany({});
    console.log('✓ Data cleared');

    // Create cinemas
    console.log('Creating cinemas...');
    const cinema1 = await Cinema.create({
      name: 'Apollo Kino Solaris',
      address: {
        street: 'Estonia pst 9',
        city: 'Tallinn',
        postalCode: '10143',
        country: 'Estonia'
      },
      phone: '+372 680 9090',
      facilities: ['Parking', 'Cafe', '3D', 'IMAX']
    });

    const cinema2 = await Cinema.create({
      name: 'Apollo Kino Ülemiste',
      address: {
        street: 'Suur-Sõjamäe 4',
        city: 'Tallinn',
        postalCode: '11415',
        country: 'Estonia'
      },
      phone: '+372 680 9090',
      facilities: ['Parking', 'Restaurant', '3D']
    });
    console.log('✓ Cinemas created');

    // Create halls
    console.log('Creating halls...');
    const hall1 = await Hall.create({
      cinema: cinema1._id,
      name: 'Hall 1',
      capacity: 120,
      rows: 10,
      seatsPerRow: 12,
      screenType: 'IMAX',
      soundSystem: 'Dolby Atmos'
    });

    const hall2 = await Hall.create({
      cinema: cinema1._id,
      name: 'Hall 2',
      capacity: 80,
      rows: 8,
      seatsPerRow: 10,
      screenType: '2D',
      soundSystem: 'Standard'
    });

    const hall3 = await Hall.create({
      cinema: cinema2._id,
      name: 'Hall 1',
      capacity: 100,
      rows: 10,
      seatsPerRow: 10,
      screenType: '3D',
      soundSystem: 'DTS:X'
    });
    console.log('✓ Halls created');

    // Create seats for each hall
    console.log('Creating seats...');
    const halls = [hall1, hall2, hall3];
    
    for (const hall of halls) {
      const seats = [];
      for (let row = 1; row <= hall.rows; row++) {
        for (let seatNum = 1; seatNum <= hall.seatsPerRow; seatNum++) {
          // Make middle rows VIP seats
          const isVip = row >= 4 && row <= 6 && seatNum >= 4 && seatNum <= (hall.seatsPerRow - 3);
          seats.push({
            hall: hall._id,
            row: row,
            number: seatNum,
            seatType: isVip ? 'vip' : 'standard',
            isActive: true
          });
        }
      }
      await Seat.insertMany(seats);
    }
    console.log('✓ Seats created');

    // Create films
    console.log('Creating films...');
    const film1 = await Film.create({
      title: 'Inception',
      originalTitle: 'Inception',
      description: 'A skilled thief is given a chance at redemption if he can successfully perform inception: planting an idea in a target\'s subconscious.',
      duration: 148,
      genre: ['Action', 'Sci-Fi', 'Thriller'],
      director: 'Christopher Nolan',
      cast: ['Leonardo DiCaprio', 'Ellen Page', 'Tom Hardy', 'Marion Cotillard'],
      releaseDate: new Date('2010-07-16'),
      language: 'English',
      subtitles: ['Estonian', 'Russian'],
      ageRating: 'PG-13',
      posterUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      rating: 8.8,
      isActive: true,
      productionYear: 2010
    });

    const film2 = await Film.create({
      title: 'The Dark Knight',
      originalTitle: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      duration: 152,
      genre: ['Action', 'Crime', 'Drama'],
      director: 'Christopher Nolan',
      cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine'],
      releaseDate: new Date('2008-07-18'),
      language: 'English',
      subtitles: ['Estonian', 'Russian'],
      ageRating: 'PG-13',
      posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      rating: 9.0,
      isActive: true,
      productionYear: 2008
    });

    const film3 = await Film.create({
      title: 'Interstellar',
      originalTitle: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      duration: 169,
      genre: ['Adventure', 'Drama', 'Sci-Fi'],
      director: 'Christopher Nolan',
      cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
      releaseDate: new Date('2014-11-07'),
      language: 'English',
      subtitles: ['Estonian', 'Russian'],
      ageRating: 'PG-13',
      posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      rating: 8.6,
      isActive: true,
      productionYear: 2014
    });
    console.log('✓ Films created');

    // Create sessions
    console.log('Creating sessions...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    // Helper to create session times
    const createSession = async (film, hall, date, hour, minute) => {
      const startTime = new Date(date);
      startTime.setHours(hour, minute, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + film.duration + 20); // Add 20 min for ads/trailers

      return await Session.create({
        film: film._id,
        hall: hall._id,
        startTime,
        endTime,
        price: {
          standard: 8.50,
          vip: 12.00,
          student: 6.50,
          child: 5.00
        },
        is3D: hall.screenType === '3D',
        subtitles: 'Estonian',
        availableSeats: hall.capacity,
        status: 'scheduled'
      });
    };

    // Create sessions for today
    await createSession(film1, hall1, today, 14, 0);
    await createSession(film1, hall1, today, 17, 30);
    await createSession(film1, hall1, today, 21, 0);
    await createSession(film2, hall2, today, 15, 0);
    await createSession(film2, hall2, today, 19, 30);
    await createSession(film3, hall3, today, 16, 0);
    await createSession(film3, hall3, today, 20, 0);

    // Create sessions for tomorrow
    await createSession(film1, hall1, tomorrow, 14, 0);
    await createSession(film1, hall1, tomorrow, 17, 30);
    await createSession(film1, hall1, tomorrow, 21, 0);
    await createSession(film2, hall2, tomorrow, 15, 0);
    await createSession(film2, hall2, tomorrow, 19, 30);
    await createSession(film3, hall3, tomorrow, 16, 0);
    await createSession(film3, hall3, tomorrow, 20, 0);

    // Create sessions for day after tomorrow
    await createSession(film1, hall1, dayAfter, 14, 0);
    await createSession(film2, hall2, dayAfter, 15, 0);
    await createSession(film3, hall3, dayAfter, 16, 0);

    console.log('✓ Sessions created');

    // Create a test user
    console.log('Creating test user...');
    await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123', // In production, this should be hashed
      phone: '+372 5555 5555',
      role: 'user'
    });
    console.log('✓ Test user created');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nCreated:');
    console.log(`- ${await Cinema.countDocuments()} cinemas`);
    console.log(`- ${await Hall.countDocuments()} halls`);
    console.log(`- ${await Seat.countDocuments()} seats`);
    console.log(`- ${await Film.countDocuments()} films`);
    console.log(`- ${await Session.countDocuments()} sessions`);
    console.log(`- ${await User.countDocuments()} user`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
