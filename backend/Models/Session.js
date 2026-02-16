const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  film: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Film',
    required: true
  },
  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  price: {
    standard: {
      type: Number,
      required: true,
      min: 0
    },
    vip: {
      type: Number,
      min: 0
    },
    student: {
      type: Number,
      min: 0
    },
    child: {
      type: Number,
      min: 0
    }
  },
  is3D: {
    type: Boolean,
    default: false
  },
  // Spoken language of the film in this session (e.g., "English", "Estonian")
  language: {
    type: String
  },
  // Comma-separated list of subtitle languages (e.g., "Estonian, Russian")
  subtitles: {
    type: String
  },
  availableSeats: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'cancelled', 'completed'],
    default: 'scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', sessionSchema);
