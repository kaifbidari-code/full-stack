const io = require('socket.io-client');
const axios = require('axios'); // need axios or fetch? I will use fetch inside async

async function run() {
  // 1. Get tokens
  const riderRes = await fetch('http://127.0.0.1:5000/api/auth/login/rider', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testrider3', password: 'password' })
  });
  const riderData = await riderRes.json();
  
  const driverRes = await fetch('http://127.0.0.1:5000/api/auth/login/driver', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testdriver3', password: 'password' })
  });
  const driverData = await driverRes.json();

  console.log("Tokens fetched.");

  // 2. Connect sockets
  const driverSocket = io('http://127.0.0.1:5000', {
    auth: { token: driverData.token }
  });

  const riderSocket = io('http://127.0.0.1:5000', {
    auth: { token: riderData.token }
  });

  driverSocket.on('connect', () => {
    console.log("Driver connected to socket:", driverSocket.id);
  });

  driverSocket.on('newRideRequest', (data) => {
    console.log("DRIVER RECEIVED NEW RIDE REQUEST EVENT!!!", data);
    process.exit(0);
  });

  riderSocket.on('connect', () => {
    console.log("Rider connected to socket:", riderSocket.id);
    
    // 3. Emit request
    setTimeout(() => {
      console.log("Rider emitting requestRide...");
      riderSocket.emit('requestRide', { test: 'data' });
    }, 1000);
  });

  setTimeout(() => {
    console.log("Timeout waiting for event");
    process.exit(1);
  }, 5000);
}

run();
