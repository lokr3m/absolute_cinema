// Export all models from a single file for easier imports
module.exports = {
  User: require('./User'),
  Cinema: require('./Cinema'),
  Hall: require('./Hall'),
  Film: require('./Film'),
  Session: require('./Session'),
  Seat: require('./Seat'),
  Booking: require('./Booking')
};
