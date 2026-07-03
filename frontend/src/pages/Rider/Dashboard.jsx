import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet-routing-machine';

const geocodeAddress = async (address) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'UberCloneApp/1.0 (contact@example.com)'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    console.warn(`Location not found for: ${address}. Using fallback.`);
  } catch (err) {
    console.error('Geocoding error:', err);
  }
  // Fallback to random offset near New York center if geocoding fails
  const randomOffset = () => (Math.random() - 0.5) * 0.05;
  return { lat: 40.7128 + randomOffset(), lng: -74.0060 + randomOffset() };
};

const getOSRMDistance = async (pickupCoords, destCoords) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${destCoords.lng},${destCoords.lat}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.routes && data.routes[0]) {
      return (data.routes[0].distance / 1000).toFixed(2);
    }
  } catch (err) {
    console.error('OSRM Distance calculation error:', err);
  }
  // Fallback to Haversine straight-line distance
  const R = 6371; // Earth radius in km
  const dLat = (destCoords.lat - pickupCoords.lat) * Math.PI / 180;
  const dLon = (destCoords.lng - pickupCoords.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  return d.toFixed(2);
};

const RiderDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [rideStatus, setRideStatus] = useState(null);
  const [fareEstimate, setFareEstimate] = useState(null);
  const [distance, setDistance] = useState(null);
  const [currentRideId, setCurrentRideId] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [routeCoords, setRouteCoords] = useState(null);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [currentRideData, setCurrentRideData] = useState(null);

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

    const fetchDrivers = async () => {
      try {
        const res = await api.get('/drivers/available');
        setDrivers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDrivers();

    const socket = getSocket();
    if (socket) {
      socket.on('rideStatusUpdate', (data) => {
        setRideStatus(`Status Update: ${data.status}`);
        toast.success(`Ride status updated: ${data.status}`);
        if (data.status === 'Completed') {
          setRideStatus('Ride Completed! Please confirm payment and rate your driver.');
          setShowRatingModal(true);
          setPaymentConfirmed(false);
        }
      });
      socket.on('driverLocationUpdate', (data) => {
        // Map updates could be handled here
      });
    }

    return () => {
      if (socket) {
        socket.off('rideStatusUpdate');
        socket.off('driverLocationUpdate');
      }
    };
  }, []);

  const handleEstimate = async () => {
    if (!pickup || !destination) return;
    try {
      // 1. Fetch coordinates and estimate actual distance
      const pickupCoords = await geocodeAddress(pickup);
      const destCoords = await geocodeAddress(destination);
      let routeDistance = null;
      if (pickupCoords && destCoords) {
        routeDistance = await getOSRMDistance(pickupCoords, destCoords);
        setDistance(routeDistance);
      }

      // 2. Query backend to calculate fare estimate using the actual distance
      const queryParam = routeDistance ? `&distance=${routeDistance}` : '';
      const res = await api.get(`/rides/estimate?pickupLocation=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}${queryParam}`);
      setFareEstimate(res.data.estimatedFare);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomFare = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && Number(value) >= 0)) {
      setFareEstimate(value);
    }
  };

  const requestRide = async (e) => {
    e.preventDefault();
    try {
      const pickupCoords = await geocodeAddress(pickup);
      const destCoords = await geocodeAddress(destination);

      if (!pickupCoords || !destCoords) {
        toast.error('Could not find location coordinates.');
        return;
      }
      
      const routeDistance = await getOSRMDistance(pickupCoords, destCoords);
      setDistance(routeDistance);
      
      setRouteCoords({ pickup: pickupCoords, destination: destCoords });

      const res = await api.post('/rides', {
        pickupLocation: pickup,
        destination: destination,
        pickupCoords,
        destCoords,
        estimatedFare: fareEstimate,
        distance: parseFloat(routeDistance),
        paymentMode,
      });
      
      setCurrentRideId(res.data._id);
      setCurrentRideData(res.data);
      const socket = getSocket();
      if (socket) {
        socket.emit('requestRide', {
          rideId: res.data._id,
          riderId: user._id,
          pickup,
          destination,
          pickupCoords,
          destCoords,
          estimatedFare: fareEstimate,
          distance: routeDistance,
          paymentMode,
        });
      }
      setRideStatus('Ride requested, waiting for a driver...');
      toast.success('Ride requested successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to request ride.');
    }
  };

  const confirmPayment = async () => {
    try {
      await api.put(`/rides/${currentRideId}/payment`);
      setPaymentConfirmed(true);
      toast.success(`Payment of ₹${currentRideData?.finalFare ?? currentRideData?.estimatedFare} confirmed via ${paymentMode}!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to confirm payment.');
    }
  };

  const submitRating = async () => {
    try {
      await api.put(`/rides/${currentRideId}/rate`, { rating, review });
      setShowRatingModal(false);
      setRideStatus(null);
      setCurrentRideId(null);
      setCurrentRideData(null);
      setPickup('');
      setDestination('');
      setFareEstimate(null);
      setDistance(null);
      setRouteCoords(null);
      setPaymentConfirmed(false);
      toast.success('Thank you for your feedback!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit rating.');
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
      if (!currentRideId || !routeCoords) return;
      
      const startLatLng = L.latLng(routeCoords.pickup.lat, routeCoords.pickup.lng);
      const destinationLatLng = L.latLng(routeCoords.destination.lat, routeCoords.destination.lng);

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
    }, [map, currentRideId, routeCoords]);

    return null;
  };

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Welcome, {user?.username} (Rider)</h2>
        <div>
          <Link to="/rider/history" className="btn" style={{ width: 'auto', marginRight: '1rem', background: 'rgba(255,255,255,0.1)' }}>View History</Link>
          <button className="btn" style={{ width: 'auto', backgroundColor: '#ef4444' }} onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-panel">
          <h3>Request a Ride</h3>
          <form onSubmit={requestRide} style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Pickup Location</label>
              <input 
                type="text" 
                value={pickup} 
                onChange={(e) => setPickup(e.target.value)}
                onBlur={handleEstimate}
                placeholder="Enter pickup location"
                required 
              />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input 
                type="text" 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)}
                onBlur={handleEstimate}
                placeholder="Enter destination"
                required 
              />
            </div>
            
            {fareEstimate && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                {distance && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Distance:</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--accent-color)' }}>{distance} km</strong>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Estimated Fare:</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--accent-color)' }}>&#8377;{fareEstimate}</strong>
                </div>
                {distance && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', padding: '0.4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    Calculation: &#8377;15 per km ({distance} km &times; &#8377;15)
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Set Custom Fare (&#8377;)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.4rem 0.75rem', border: '1px solid var(--glass-border)' }}>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>&#8377;</span>
                    <input
                      type="number"
                      value={fareEstimate}
                      onChange={handleCustomFare}
                      min="0"
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', width: '100%', fontSize: '1rem' }}
                      placeholder="Enter custom amount"
                    />
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    💳 Payment Mode
                  </label>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {[
                      { mode: 'cash',   icon: '💵', label: 'Cash'   },
                      { mode: 'card',   icon: '💳', label: 'Card'   },
                      { mode: 'wallet', icon: '📲', label: 'Wallet' },
                    ].map(({ mode, icon, label }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        style={{
                          flex: 1,
                          padding: '0.6rem 0.4rem',
                          borderRadius: '10px',
                          border: `2px solid ${paymentMode === mode ? 'var(--accent-color)' : 'rgba(255,255,255,0.12)'}`,
                          background: paymentMode === mode ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.04)',
                          color: paymentMode === mode ? 'var(--accent-color)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontWeight: paymentMode === mode ? '700' : '400',
                          fontSize: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.2rem',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <button type="submit" className="btn">Find a Driver</button>
          </form>
          
          {rideStatus && (
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', border: '1px solid var(--accent-color)' }}>
              <strong>Status:</strong> {rideStatus}
            </div>
          )}

          {showRatingModal && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              {/* Payment Confirmation */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16,185,129,0.08)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.25)' }}>
                <h4 style={{ marginBottom: '0.75rem' }}>💳 Payment Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Mode:</span>
                  <strong style={{ textTransform: 'capitalize' }}>
                    {paymentMode === 'cash' ? '💵' : paymentMode === 'card' ? '💳' : '📲'} {paymentMode}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount:</span>
                  <strong style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}>
                    &#8377;{currentRideData?.finalFare ?? currentRideData?.estimatedFare ?? fareEstimate}
                  </strong>
                </div>
                {paymentConfirmed ? (
                  <div style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(16,185,129,0.2)', borderRadius: '8px', color: '#10b981', fontWeight: '600' }}>
                    ✅ Payment Confirmed!
                  </div>
                ) : (
                  <button
                    className="btn"
                    onClick={confirmPayment}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    Confirm Payment
                  </button>
                )}
              </div>

              {/* Rating */}
              <h4>⭐ Rate Your Ride</h4>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Rating (1-5)</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Review (Optional)</label>
                <input 
                  type="text" 
                  value={review} 
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="How was the driver?"
                />
              </div>
              <button className="btn btn-accent" onClick={submitRating}>Submit Feedback</button>
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ padding: '1.5rem 1.5rem 0.5rem 1.5rem' }}>Map View</h3>
          <div style={{ flex: 1, minHeight: '400px' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <ChangeView center={mapCenter} />
              <RoutingMachine />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={mapCenter}>
                <Popup>Your Location</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
