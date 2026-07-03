import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet-routing-machine';

const DriverDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [isOnline, setIsOnline] = useState(user?.availability === 'Online');
  const [rideRequests, setRideRequests] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);

  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]);

  useEffect(() => {
    // Attempt to get user's real location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }

    const socket = getSocket();
    if (socket) {
      socket.on('newRideRequest', (data) => {
        console.log('[Socket] Received newRideRequest:', data);
        if (isOnline && !currentRide) {
          console.log('[Socket] Driver is online, showing request.');
          setRideRequests(prev => {
            // prevent duplicates
            if (prev.find(r => r.rideId === data.rideId)) return prev;
            return [...prev, data];
          });
          toast.success('New ride request received!', { duration: 5000, icon: '🚕' });
          
          // Show Browser Notification
          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('New Ride Request! 🚕', { body: `Pickup: ${data.pickup}\nDestination: ${data.destination}` });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('New Ride Request! 🚕', { body: `Pickup: ${data.pickup}\nDestination: ${data.destination}` });
                }
              });
            }
          }
          
        } else {
          console.log(`[Socket] Ignored request. isOnline: ${isOnline}, currentRide: ${!!currentRide}`);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('newRideRequest');
      }
    };
  }, [isOnline, currentRide]);

  // Fetch pending rides when driver goes online or loads page while online
  useEffect(() => {
    if (isOnline && !currentRide) {
      const fetchPending = async () => {
        try {
          const res = await api.get('/rides/pending');
          // Format DB rides to match socket ride format
          const formattedRides = res.data.map(dbRide => ({
            rideId: dbRide._id,
            riderId: dbRide.riderId._id || dbRide.riderId,
            pickup: dbRide.pickupLocation,
            destination: dbRide.destination,
            pickupCoords: dbRide.pickupCoords,
            destCoords: dbRide.destCoords,
            estimatedFare: dbRide.estimatedFare,
            distance: dbRide.distance
          }));
          setRideRequests(formattedRides);
        } catch (err) {
          console.error('Failed to fetch pending rides', err);
        }
      };
      fetchPending();
    } else if (!isOnline) {
      setRideRequests([]);
    }
  }, [isOnline, currentRide]);

  const toggleStatus = async () => {
    try {
      const res = await api.put('/drivers/availability');
      const newStatus = res.data.availability === 'Online';
      setIsOnline(newStatus);
      
      // Update local storage so it persists across page refreshes
      const updatedUser = { ...user, availability: res.data.availability };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      if (newStatus && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
      
      toast.success(`You are now ${newStatus ? 'Online' : 'Offline'}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to change status');
    }
  };

  const acceptRide = async (rideData) => {
    try {
      await api.put(`/rides/${rideData.rideId}/status`, { status: 'Accepted' });
      setCurrentRide(rideData);
      setRideRequests([]); // clear other requests
      
      const socket = getSocket();
      if (socket) {
        socket.emit('rideAccepted', {
          rideId: rideData.rideId,
          riderId: rideData.riderId,
          driverId: user._id
        });
      }
      toast.success('Ride accepted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to accept ride');
    }
  };

  const updateRideStatus = async (status) => {
    try {
      await api.put(`/rides/${currentRide.rideId}/status`, { status });
      
      const socket = getSocket();
      if (socket) {
        socket.emit('updateRideStatus', {
          rideId: currentRide.rideId,
          riderId: currentRide.riderId,
          status
        });
      }
      
      if (status === 'Completed') {
        setCurrentRide(null); // Reset after completion
        toast.success('Ride completed successfully!');
      } else {
        toast.success(`Ride status updated to: ${status}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  // Custom hook component to update map center dynamically
  const ChangeView = ({ center }) => {
    const map = useMap();
    map.setView(center);
    return null;
  };

  // Component to render routing line
  const RoutingMachine = () => {
    const map = useMap();

    useEffect(() => {
      if (!currentRide || !currentRide.pickupCoords || !currentRide.destCoords) return;
      
      const startLatLng = L.latLng(currentRide.pickupCoords.lat, currentRide.pickupCoords.lng);
      const destinationLatLng = L.latLng(currentRide.destCoords.lat, currentRide.destCoords.lng);

      const routingControl = L.Routing.control({
        waypoints: [startLatLng, destinationLatLng],
        lineOptions: {
          styles: [{ color: 'var(--primary-color)', weight: 4 }]
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
      }).addTo(map);

      return () => map.removeControl(routingControl);
    }, [map, currentRide]);

    return null;
  };

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Welcome, {user?.username} (Driver)</h2>
        <div>
          <Link to="/driver/history" className="btn" style={{ width: 'auto', marginRight: '1rem', background: 'rgba(255,255,255,0.1)' }}>View History</Link>
          <button 
            className={`btn ${isOnline ? 'btn-accent' : ''}`} 
            style={{ width: 'auto', marginRight: '1rem', backgroundColor: isOnline ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)' }} 
            onClick={toggleStatus}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
          <button className="btn" style={{ width: 'auto', backgroundColor: '#ef4444' }} onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel">
            <h3>Incoming Ride Requests</h3>
            {!isOnline ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Go online to receive ride requests.</p>
            ) : rideRequests.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Listening for requests...</p>
            ) : (
              <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
                {rideRequests.map((req, idx) => (
                  <li key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1rem' }}>
                    <p><strong>Pickup:</strong> {req.pickup}</p>
                    <p><strong>Destination:</strong> {req.destination}</p>
                    {req.distance && <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}><strong>Distance:</strong> {req.distance} km</p>}
                    {req.estimatedFare && <p style={{ color: 'var(--accent-color)', marginTop: '0.25rem' }}><strong>Est. Fare:</strong> &#8377;{req.estimatedFare}</p>}
                    <button className="btn btn-accent" style={{ marginTop: '1rem' }} onClick={() => acceptRide(req)}>Accept Ride</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass-panel">
            <h3>Current Active Ride</h3>
             {currentRide ? (
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Pickup:</strong> {currentRide.pickup}</p>
                <p><strong>Destination:</strong> {currentRide.destination}</p>
                {currentRide.distance && <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}><strong>Distance:</strong> {currentRide.distance} km</p>}
                {currentRide.estimatedFare && <p style={{ color: 'var(--accent-color)', marginTop: '0.25rem' }}><strong>Est. Fare:</strong> &#8377;{currentRide.estimatedFare}</p>}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn" style={{ backgroundColor: '#f59e0b' }} onClick={() => updateRideStatus('Ongoing')}>Start Trip</button>
                  <button className="btn btn-accent" onClick={() => updateRideStatus('Completed')}>Complete Trip</button>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>No active rides.</p>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ padding: '1.5rem 1.5rem 0.5rem 1.5rem' }}>Map View</h3>
          <div style={{ flex: 1, minHeight: '500px' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <ChangeView center={mapCenter} />
              <RoutingMachine />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={mapCenter}>
                <Popup>Driver Location</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
