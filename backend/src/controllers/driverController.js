const Driver = require('../models/Driver');

exports.getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ availability: 'Online' }).select('-password');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    driver.availability = driver.availability === 'Online' ? 'Offline' : 'Online';
    await driver.save();
    
    res.json({ availability: driver.availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
