require('dotenv').config();
const mongoose = require('mongoose');
const { Film, Session, Hall } = require('./Models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinema';

async function addUpcomingSessions() {
  try {
    console.log('Connecting to MongoDB...');
    console.log(`Using connection string: ${MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB successfully');

    // Get all films
    console.log('Fetching films...');
    const films = await Film.find({});
    if (films.length === 0) {
      console.log('⚠ No films found in database. Please run seed.js first.');
      process.exit(0);
    }
    console.log(`✓ Found ${films.length} films`);

    // Get all halls
    console.log('Fetching halls...');
    const halls = await Hall.find({});
    if (halls.length === 0) {
      console.log('⚠ No halls found in database. Please run seed.js first.');
      process.exit(0);
    }
    console.log(`✓ Found ${halls.length} halls`);

    // Delete sessions older than today
    console.log('Removing old sessions...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deletedResult = await Session.deleteMany({ startTime: { $lt: today } });
    console.log(`✓ Removed ${deletedResult.deletedCount} old sessions`);

    // Create sessions for the next 7 days
    console.log('Creating sessions for the next 7 days...');
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
            is3D: Array.isArray(film.genre) && film.genre.includes('Animation') && Math.random() > 0.5,
            subtitles: film.subtitles && film.subtitles.length > 0 ? film.subtitles[0] : 'None',
            availableSeats: Math.max(0, hall.capacity - Math.floor(Math.random() * 30)),
            status: 'scheduled'
          };

          sessions.push(session);
        }
      }
    }

    await Session.insertMany(sessions);
    console.log(`✓ Inserted ${sessions.length} new sessions`);

    console.log('\n=== Sessions updated successfully! ===');
    console.log(`Total: ${sessions.length} new sessions for the next 7 days`);
    
  } catch (error) {
    console.error('Error updating sessions:', error);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n❌ Could not connect to MongoDB. Please check:');
      console.error('1. MongoDB is running (mongod service)');
      console.error('2. Connection string is correct');
      console.error('3. Network connectivity');
      console.error(`\n   Current MONGODB_URI: ${MONGODB_URI}`);
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the script
addUpcomingSessions();
