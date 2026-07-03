const Ride = require('../models/Ride');
const RATE_PER_KM = 15; // ₹15 per km
const Driver = require('../models/Driver');

exports.createRide = async (req, res) => {
  const {
    pickupLocation,
    destination,
    pickupCoords,
    destCoords,
    estimatedFare,
    distance,
    paymentMode,   // 'cash' | 'card' | 'wallet'
  } = req.body;

  const allowedModes = ['cash', 'card', 'wallet'];
  if (paymentMode && !allowedModes.includes(paymentMode)) {
    return res.status(400).json({ message: `Invalid paymentMode. Must be one of: ${allowedModes.join(', ')}` });
  }

  // Calculate fare per km
  const dist = parseFloat(distance) || 0;
  const computedFare = dist > 0 ? parseFloat((dist * RATE_PER_KM).toFixed(2)) : (estimatedFare || 0);

  try {
    const ride = await Ride.create({
      riderId: req.user._id,
      pickupLocation,
      destination,
      pickupCoords,
      destCoords,
      distance: dist,
      farePerKm: RATE_PER_KM,
      estimatedFare: computedFare,
      paymentMode: paymentMode || 'cash',
      paymentStatus: 'pending',
      status: 'Pending',
    });
    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRideHistory = async (req, res) => {
  try {
    let rides;
    if (req.user.role === 'rider') {
      rides = await Ride.find({ riderId: req.user._id }).populate('driverId', 'username').sort('-createdAt');
    } else if (req.user.role === 'driver') {
      rides = await Ride.find({ driverId: req.user._id }).populate('riderId', 'username').sort('-createdAt');
    }
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingRides = async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'Pending' }).populate('riderId', 'username').sort('-createdAt');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRideStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    console.log(`[DEBUG] Updating ride ${ride._id}, currentStatus=${ride.status}, requestedStatus=${status}, req.user._id=${req.user._id}`);

    if (status === 'Accepted') {
      ride.driverId = req.user._id;
      console.log(`[DEBUG] Set driverId to ${req.user._id}`);
    } else if (status !== 'Accepted' && ride.driverId && ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ride' });
    }

    // When ride completes, lock in the final fare per km
    if (status === 'Completed') {
      const dist = parseFloat(ride.distance) || 0;
      ride.finalFare = dist > 0
        ? parseFloat((dist * (ride.farePerKm || RATE_PER_KM)).toFixed(2))
        : (ride.estimatedFare || 0);
    }

    ride.status = status;
    await ride.save();
    console.log(`[DEBUG] Ride saved. driverId=${ride.driverId}, status=${ride.status}`);
    res.json(ride);
  } catch (error) {
    console.error(`[DEBUG] updateRideStatus error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.estimateFare = async (req, res) => {
  const { pickupLocation, destination, distance } = req.query;
  try {
    let dist = parseFloat(distance);

    if (isNaN(dist)) {
      // Mock fallback if no distance provided
      dist = Math.abs((pickupLocation?.length || 5) - (destination?.length || 5)) + 2;
    }

    const estimatedFare = dist * RATE_PER_KM;

    res.json({
      distanceKm: dist.toFixed(2),
      farePerKm: RATE_PER_KM,
      estimatedFare: estimatedFare.toFixed(2),
      currency: 'INR',
      paymentModes: ['cash', 'card', 'wallet'],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark ride payment as paid (rider only, after completion)
exports.markPayment = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (ride.riderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (ride.status !== 'Completed') {
      return res.status(400).json({ message: 'Ride must be Completed before marking payment' });
    }
    if (ride.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment already marked as paid' });
    }

    ride.paymentStatus = 'paid';
    await ride.save();
    res.json({
      message: 'Payment confirmed',
      paymentMode: ride.paymentMode,
      finalFare: ride.finalFare,
      currency: 'INR',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rateRide = async (req, res) => {
  const { rating, review } = req.body;
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    
    if (ride.riderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this ride' });
    }

    if (ride.status !== 'Completed') {
      return res.status(400).json({ message: 'Can only rate completed rides' });
    }

    ride.rating = rating;
    if (review) ride.review = review;
    
    await ride.save();
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
