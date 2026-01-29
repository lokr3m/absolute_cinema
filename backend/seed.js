require('dotenv').config();
const mongoose = require('mongoose');
const { Film, Session, Cinema, Hall } = require('./Models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinema';

// Sample cinema data
const sampleCinemas = [
  {
    name: 'Apollo Kino Solaris',
    address: {
      street: 'Estonia pst 9',
      city: 'Tallinn',
      postalCode: '10143',
      country: 'Estonia'
    },
    phone: '+372 6273 500',
    email: 'info@apollokino.ee',
    facilities: ['IMAX', '3D', 'Dolby Atmos', 'Parking', 'Cafe']
  },
  {
    name: 'Apollo Kino Ülemiste',
    address: {
      street: 'Suur-Sõjamäe 4',
      city: 'Tallinn',
      postalCode: '11415',
      country: 'Estonia'
    },
    phone: '+372 6273 500',
    email: 'info@apollokino.ee',
    facilities: ['IMAX', '3D', 'Dolby Atmos', 'Parking']
  }
];

// Sample film data (inspired by Apollo Kino typical offerings)
const sampleFilms = [
  {
    title: 'Gladiaator II',
    originalTitle: 'Gladiator II',
    description: 'Pärast Marcus Aureliuse surma valitseb Rooma impeeriumi korrumpeerunud Commoduse juhtimine. Lucius Verus, Maximuse poeg, peab võitlema vabaduse eest.',
    duration: 148,
    genre: ['Action', 'Drama', 'Adventure'],
    director: 'Ridley Scott',
    cast: ['Paul Mescal', 'Denzel Washington', 'Pedro Pascal', 'Connie Nielsen'],
    releaseDate: new Date('2024-11-15'),
    language: 'English',
    subtitles: ['Estonian', 'Russian'],
    ageRating: 'K-12',
    posterUrl: 'https://via.placeholder.com/300x450/FF5733/FFFFFF?text=Gladiator+II',
    trailerUrl: '',
    rating: 8.5,
    isActive: true
  },
  {
    title: 'Vaiana 2',
    originalTitle: 'Moana 2',
    description: 'Vaiana on tagasi uues seikluses! Kolm aastat pärast esimest filmi saab Vaiana oma eelkäijatelt ootamatu kõne ja peab koos Maui ja uue meeskonnaga purjetama ookeanidesse.',
    duration: 100,
    genre: ['Animation', 'Adventure', 'Family', 'Musical'],
    director: 'David Derrick Jr.',
    cast: ['Auli\'i Cravalho', 'Dwayne Johnson'],
    releaseDate: new Date('2024-11-29'),
    language: 'English',
    subtitles: ['Estonian'],
    ageRating: 'MS-6',
    posterUrl: 'https://via.placeholder.com/300x450/4287f5/FFFFFF?text=Moana+2',
    trailerUrl: '',
    rating: 7.8,
    isActive: true
  },
  {
    title: 'Kurjam kui kuri',
    originalTitle: 'Wicked',
    description: 'Muusikaline eepika räägib legendaarse muinasjutu tundmatust loost. Enne Dorothi saabumist oli Oz teistsugune koht.',
    duration: 160,
    genre: ['Musical', 'Fantasy', 'Romance'],
    director: 'Jon M. Chu',
    cast: ['Cynthia Erivo', 'Ariana Grande', 'Michelle Yeoh', 'Jeff Goldblum'],
    releaseDate: new Date('2024-11-22'),
    language: 'English',
    subtitles: ['Estonian', 'Russian'],
    ageRating: 'MS-6',
    posterUrl: 'https://via.placeholder.com/300x450/00ff00/000000?text=Wicked',
    trailerUrl: '',
    rating: 8.2,
    isActive: true
  },
  {
    title: 'Meie aeg',
    originalTitle: 'We Live in Time',
    description: 'Almut (Florence Pugh) ja Tobias (Andrew Garfield) kogevad ebatraditsioonilist romantilist seiklust läbi kümne aasta.',
    duration: 108,
    genre: ['Romance', 'Drama'],
    director: 'John Crowley',
    cast: ['Florence Pugh', 'Andrew Garfield'],
    releaseDate: new Date('2024-11-08'),
    language: 'English',
    subtitles: ['Estonian', 'Russian'],
    ageRating: 'K-12',
    posterUrl: 'https://via.placeholder.com/300x450/ff1493/FFFFFF?text=We+Live+in+Time',
    trailerUrl: '',
    rating: 7.5,
    isActive: true
  },
  {
    title: 'Venom: Viimane tants',
    originalTitle: 'Venom: The Last Dance',
    description: 'Eddie ja Venom on põgenemisteel. Kurnatud ja jälitatud on nad sunnitud tegema hävitava otsuse.',
    duration: 109,
    genre: ['Action', 'Sci-Fi', 'Thriller'],
    director: 'Kelly Marcel',
    cast: ['Tom Hardy', 'Chiwetel Ejiofor', 'Juno Temple'],
    releaseDate: new Date('2024-10-25'),
    language: 'English',
    subtitles: ['Estonian', 'Russian'],
    ageRating: 'K-12',
    posterUrl: 'https://via.placeholder.com/300x450/800080/FFFFFF?text=Venom+3',
    trailerUrl: '',
    rating: 7.0,
    isActive: true
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    console.log(`Using connection string: ${MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB successfully');

    // Clear existing data
    console.log('Clearing existing data...');
    await Film.deleteMany({});
    await Session.deleteMany({});
    await Hall.deleteMany({});
    await Cinema.deleteMany({});

    // Insert cinemas
    console.log('Inserting cinemas...');
    const cinemas = await Cinema.insertMany(sampleCinemas);
    console.log(`✓ Inserted ${cinemas.length} cinemas`);

    // Insert halls for each cinema
    console.log('Inserting halls...');
    const halls = [];
    for (const cinema of cinemas) {
      for (let i = 1; i <= 3; i++) {
        const hall = await Hall.create({
          name: `Hall ${i}`,
          cinema: cinema._id,
          capacity: 150 + (i * 50),
          screenType: i === 1 ? 'IMAX' : (i === 2 ? '3D' : 'Standard'),
          soundSystem: i <= 2 ? 'Dolby Atmos' : 'Digital 5.1',
          rows: 10 + i,
          seatsPerRow: 15
        });
        halls.push(hall);
      }
    }
    console.log(`✓ Inserted ${halls.length} halls`);

    // Insert films
    console.log('Inserting films...');
    const films = await Film.insertMany(sampleFilms);
    console.log(`✓ Inserted ${films.length} films`);

    // Create sessions for the next 7 days
    console.log('Creating sessions...');
    const sessions = [];
    const now = new Date();
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      date.setHours(0, 0, 0, 0);

      // Create 3 sessions per film per day
      for (const film of films) {
        const showTimes = ['10:00', '14:30', '19:00'];
        
        for (let i = 0; i < showTimes.length; i++) {
          const [hours, minutes] = showTimes[i].split(':');
          const startTime = new Date(date);
          startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + film.duration + 15); // Add 15min for ads

          // Select a random hall
          const hall = halls[Math.floor(Math.random() * halls.length)];

          const session = {
            film: film._id,
            hall: hall._id,
            startTime: startTime,
            endTime: endTime,
            price: {
              standard: 8.5 + (i * 0.5), // Evening sessions are more expensive
              student: 6.0,
              child: 5.0,
              vip: 12.0
            },
            is3D: film.genre.includes('Animation') && Math.random() > 0.5,
            subtitles: film.subtitles[0],
            availableSeats: hall.capacity - Math.floor(Math.random() * 30),
            status: 'scheduled'
          };

          sessions.push(session);
        }
      }
    }

    await Session.insertMany(sessions);
    console.log(`✓ Inserted ${sessions.length} sessions`);

    console.log('\n=== Database seeded successfully! ===');
    console.log(`Total: ${cinemas.length} cinemas, ${halls.length} halls, ${films.length} films, ${sessions.length} sessions`);
    
  } catch (error) {
    console.error('Error seeding database:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.error('\n❌ CONNECTION ERROR: Cannot connect to MongoDB Atlas');
      console.error('\nPlease follow these steps:');
      console.error('\n1. Copy .env.example to .env:');
      console.error('   cp .env.example .env');
      console.error('\n2. Set up MongoDB Atlas (free tier):');
      console.error('   - Go to https://www.mongodb.com/cloud/atlas');
      console.error('   - Create a free M0 cluster');
      console.error('   - Create a database user');
      console.error('   - Whitelist your IP (or use 0.0.0.0/0 for testing)');
      console.error('   - Get your connection string');
      console.error('\n3. Update .env with your MongoDB Atlas connection string:');
      console.error('   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cinema?retryWrites=true&w=majority');
      console.error('\n4. Current MONGODB_URI:');
      console.error(`   ${MONGODB_URI}`);
      console.error('\nFor detailed setup instructions, see QUICKSTART.md');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeder
seedDatabase();
