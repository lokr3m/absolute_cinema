const mongoose = require('mongoose');

const filmSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalTitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  genre: [{
    type: String,
    required: true
  }],
  director: {
    type: String,
    required: true
  },
  cast: [{
    type: String
  }],
  releaseDate: {
    type: Date,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  subtitles: [{
    type: String
  }],
  ageRating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'MS-1', 'MS-6', 'MS-12', 'K-12', 'K-14', 'K-16', 'PERE', '-'],
    required: true
  },
  posterUrl: {
    type: String
  },
  trailerUrl: {
    type: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Film', filmSchema);
