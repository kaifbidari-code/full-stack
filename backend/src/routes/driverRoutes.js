const express = require('express');
const router = express.Router();
const { getAvailableDrivers, toggleAvailability } = require('../controllers/driverController');
const { protect, driverOnly } = require('../middleware/authMiddleware');

// Route to get available drivers (riders or anyone authenticated can view)
router.get('/available', protect, getAvailableDrivers);

// Route for a driver to toggle their availability
router.put('/availability', protect, driverOnly, toggleAvailability);

module.exports = router;
