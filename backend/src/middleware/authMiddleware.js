const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.role === 'rider') {
        req.user = await User.findById(decoded.id).select('-password');
        req.user.role = 'rider';
      } else if (decoded.role === 'driver') {
        req.user = await Driver.findById(decoded.id).select('-password');
        req.user.role = 'driver';
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const driverOnly = (req, res, next) => {
  if (req.user && req.user.role === 'driver') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a driver' });
  }
};

const riderOnly = (req, res, next) => {
  if (req.user && req.user.role === 'rider') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a rider' });
  }
};

module.exports = { protect, driverOnly, riderOnly };
