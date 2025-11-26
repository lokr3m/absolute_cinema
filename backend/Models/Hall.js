const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  cinema: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cinema',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  rows: {
    type: Number,
    required: true,
    min: 1
  },
  seatsPerRow: {
    type: Number,
    required: true,
    min: 1
  },
  screenType: {
    type: String,
    enum: ['2D', '3D', 'IMAX', '4DX', 'VIP', 'Standard'],
    default: '2D'
  },
  soundSystem: {
    type: String,
    enum: ['Standard', 'Dolby Atmos', 'DTS:X', 'Digital 5.1'],
    default: 'Standard'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hall', hallSchema);
