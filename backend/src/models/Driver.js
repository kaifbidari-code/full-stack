const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  availability: {
    type: String,
    enum: ['Online', 'Offline'],
    default: 'Offline'
  }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
