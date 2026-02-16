const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  hall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true
  },
  row: {
    type: Number,
    required: true,
    min: 1
  },
  number: {
    type: Number,
    required: true,
    min: 1
  },
  seatType: {
    type: String,
    enum: ['standard', 'vip', 'twin', 'wheelchair'],
    default: 'standard'
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

// Ensure unique seat per hall (row + number combination)
seatSchema.index({ hall: 1, row: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
