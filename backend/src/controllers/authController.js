const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.registerRider = async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await User.create({ username, password: hashedPassword });
    }
    res.status(200).json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id, 'rider'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginRider = async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (!user) {
      // Auto-create if doesn't exist
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await User.create({ username, password: hashedPassword });
    }
    // Always succeed
    res.json({
      _id: user._id,
      username: user.username,
      token: generateToken(user._id, 'rider'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.registerDriver = async (req, res) => {
  const { username, password } = req.body;
  try {
    let driver = await Driver.findOne({ username });
    if (!driver) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      driver = await Driver.create({ username, password: hashedPassword });
    }
    res.status(200).json({
      _id: driver._id,
      username: driver.username,
      token: generateToken(driver._id, 'driver'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginDriver = async (req, res) => {
  const { username, password } = req.body;
  try {
    let driver = await Driver.findOne({ username });
    if (!driver) {
      // Auto-create if doesn't exist
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      driver = await Driver.create({ username, password: hashedPassword });
    }
    // Always succeed
    res.json({
      _id: driver._id,
      username: driver.username,
      availability: driver.availability,
      token: generateToken(driver._id, 'driver'),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
