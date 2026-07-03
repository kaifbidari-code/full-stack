const express = require('express');
const router = express.Router();
const { createRide, getRideHistory, getPendingRides, updateRideStatus, estimateFare, rateRide, markPayment } = require('../controllers/rideController');
const { protect, riderOnly, driverOnly } = require('../middleware/authMiddleware');

router.get('/estimate', protect, riderOnly, estimateFare);
router.post('/', protect, riderOnly, createRide);
router.get('/history', protect, getRideHistory);
router.get('/pending', protect, driverOnly, getPendingRides);
router.put('/:id/status', protect, driverOnly, updateRideStatus);
router.put('/:id/rate', protect, riderOnly, rateRide);
router.put('/:id/payment', protect, riderOnly, markPayment);

module.exports = router;
