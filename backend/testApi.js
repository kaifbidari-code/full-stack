async function test() {
  try {
    // 1. Register/Login Rider
    const riderRes = await fetch('http://127.0.0.1:5000/api/auth/login/rider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testrider2', password: 'password' })
    });
    const riderData = await riderRes.json();
    const riderToken = riderData.token;
    console.log('Rider:', riderData);

    // 2. Register/Login Driver
    const driverRes = await fetch('http://127.0.0.1:5000/api/auth/login/driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testdriver2', password: 'password' })
    });
    const driverData = await driverRes.json();
    const driverToken = driverData.token;
    console.log('Driver:', driverData);

    // 3. Create Ride
    const rideRes = await fetch('http://127.0.0.1:5000/api/rides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${riderToken}` },
      body: JSON.stringify({ pickupLocation: 'A', destination: 'B' })
    });
    const rideData = await rideRes.json();
    const rideId = rideData._id;
    console.log('Created Ride:', rideData);

    // 4. Accept Ride as Driver
    const acceptRes = await fetch(`http://127.0.0.1:5000/api/rides/${rideId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
      body: JSON.stringify({ status: 'Accepted' })
    });
    const acceptData = await acceptRes.json();
    console.log('Accepted Ride:', acceptData);

    // 5. Get Driver History
    const historyRes = await fetch('http://127.0.0.1:5000/api/rides/history', {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    const historyData = await historyRes.json();
    console.log('Driver History:', historyData);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
