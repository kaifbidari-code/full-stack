const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null,
  },
  pickupLocation: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  pickupCoords: {
    lat: Number,
    lng: Number
  },
  destCoords: {
    lat: Number,
    lng: Number
  },
  estimatedFare: {
    type: Number
  },
  distance: {
    type: Number
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'card', 'wallet'],
    default: 'cash',
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  farePerKm: {
    type: Number,
    default: 15, // ₹15 per km
  },
  finalFare: {
    type: Number,
    default: null,
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Ongoing', 'Completed'],
    default: 'Pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  review: {
    type: String,
    trim: true,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
