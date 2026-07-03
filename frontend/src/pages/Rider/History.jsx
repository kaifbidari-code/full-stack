import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const RiderHistory = () => {
  const { user } = useContext(AuthContext);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/rides/history');
        setRides(res.data);
      } catch (err) {
        console.error('Failed to fetch ride history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
      case 'Accepted': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
      case 'Ongoing': return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
      default: return { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' };
    }
  };

  const getPaymentIcon = (mode) => {
    switch (mode) {
      case 'card':   return '💳';
      case 'wallet': return '📲';
      default:       return '💵';
    }
  };

  const getPaymentStatusStyle = (ps) => ps === 'paid'
    ? { bg: 'rgba(16,185,129,0.2)', color: '#10b981', label: '✅ Paid' }
    : { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: '⏳ Pending' };

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>🧾 Ride History</h2>
        <Link to="/rider/dashboard" className="btn" style={{ width: 'auto', background: 'rgba(255,255,255,0.1)' }}>← Back to Dashboard</Link>
      </div>

      <div className="glass-panel">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading history...</p>
        ) : rides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '3rem' }}>🚗</p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>You have not taken any rides yet.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {rides.map(ride => {
              const statusStyle = getStatusColor(ride.status);
              return (
                <li key={ride._id} style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(0,0,0,0.2)', 
                  borderRadius: '12px', 
                  marginBottom: '1rem',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</p>
                      <p style={{ fontWeight: '600' }}>{new Date(ride.createdAt).toLocaleDateString('en-IN')}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(ride.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route</p>
                      <p style={{ fontSize: '0.95rem' }}>📍 {ride.pickupLocation}</p>
                      <p style={{ fontSize: '0.95rem', marginTop: '0.25rem' }}>🏁 {ride.destination}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Distance</p>
                      <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                        {ride.distance ? `${ride.distance} km` : '—'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fare</p>
                      <p style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--accent-color)' }}>
                        {ride.finalFare ? `₹${ride.finalFare}` : ride.estimatedFare ? `₹${ride.estimatedFare}` : '—'}
                      </p>
                      {/* Payment mode + status */}
                      {ride.paymentMode && (
                        <div style={{ marginTop: '0.4rem' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>
                            {getPaymentIcon(ride.paymentMode)} {ride.paymentMode}
                          </span>
                          {(() => {
                            const ps = getPaymentStatusStyle(ride.paymentStatus);
                            return (
                              <span style={{
                                fontSize: '0.72rem', fontWeight: '600',
                                padding: '0.15rem 0.5rem', borderRadius: '20px',
                                background: ps.bg, color: ps.color,
                                display: 'inline-block', marginTop: '0.2rem'
                              }}>{ps.label}</span>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</p>
                      <span style={{ 
                        padding: '0.3rem 0.75rem', 
                        borderRadius: '20px', 
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>{ride.status}</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Driver: {ride.driverId ? ride.driverId.username : 'N/A'}
                      </p>
                      {ride.rating && (
                        <p style={{ fontSize: '0.85rem', color: '#fbbf24', marginTop: '0.25rem' }}>
                          {'★'.repeat(ride.rating)}{'☆'.repeat(5 - ride.rating)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RiderHistory;
