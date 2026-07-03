const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Driver = require('./models/Driver');

module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      
      // Join a room based on the user's ID to receive direct messages
      socket.join(decoded.id);
      
      if (decoded.role === 'driver') {
        socket.join('drivers'); // Room for all drivers
        console.log(`[Socket] Driver ${decoded.id} joined 'drivers' room.`);
      }

      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

    // Rider requests a ride
    socket.on('requestRide', (rideData) => {
      console.log(`[Socket] requestRide received from rider. Broadcasting to 'drivers' room...`, rideData);
      socket.to('drivers').emit('newRideRequest', rideData);
    });

    // Driver updates location
    socket.on('updateLocation', (locationData) => {
      // locationData should contain { rideId, riderId, lat, lng }
      // Send location directly to the rider
      if (locationData.riderId) {
        socket.to(locationData.riderId).emit('driverLocationUpdate', locationData);
      }
    });

    // Driver accepts ride
    socket.on('rideAccepted', (data) => {
      // data: { rideId, riderId, driverId }
      socket.to(data.riderId).emit('rideStatusUpdate', {
        rideId: data.rideId,
        status: 'Accepted',
        driverId: data.driverId
      });
    });

    // Driver updates ride status (Ongoing, Completed)
    socket.on('updateRideStatus', (data) => {
      // data: { rideId, riderId, status }
      socket.to(data.riderId).emit('rideStatusUpdate', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
};
