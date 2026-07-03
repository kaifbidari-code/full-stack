const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/uber-clone')
  .then(async () => {
    const rides = await mongoose.connection.collection('rides').find().toArray();
    console.log('Rides:', rides);
    process.exit(0);
  });
