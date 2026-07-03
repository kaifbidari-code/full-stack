import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';

import RiderLogin from './pages/Rider/Login';
import RiderRegister from './pages/Rider/Register';
import RiderDashboard from './pages/Rider/Dashboard';
import RiderHistory from './pages/Rider/History';

import DriverLogin from './pages/Driver/Login';
import DriverRegister from './pages/Driver/Register';
import DriverDashboard from './pages/Driver/Dashboard';
import DriverHistory from './pages/Driver/History';

const Home = () => (
  <div className="flex-center">
    <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', width: '100%', maxWidth: '600px' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Uber Clone</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.2rem' }}>The future of modern ride booking.</p>
      
      <div className="grid-2">
        <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
          <h3>For Riders</h3>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Book rides seamlessly in real-time.</p>
          <Link to="/rider/login" className="btn">Rider Portal</Link>
        </div>
        <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
          <h3>For Drivers</h3>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Manage requests and earn money.</p>
          <Link to="/driver/login" className="btn btn-accent">Driver Portal</Link>
        </div>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to={`/${role}/login`} />;
  if (user.role !== role) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Rider Routes */}
        <Route path="/rider/login" element={<RiderLogin />} />
        <Route path="/rider/register" element={<RiderRegister />} />
        <Route 
          path="/rider/dashboard" 
          element={
            <ProtectedRoute role="rider">
              <RiderDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/rider/history" 
          element={
            <ProtectedRoute role="rider">
              <RiderHistory />
            </ProtectedRoute>
          } 
        />
        
        {/* Driver Routes */}
        <Route path="/driver/login" element={<DriverLogin />} />
        <Route path="/driver/register" element={<DriverRegister />} />
        <Route 
          path="/driver/dashboard" 
          element={
            <ProtectedRoute role="driver">
              <DriverDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/driver/history" 
          element={
            <ProtectedRoute role="driver">
              <DriverHistory />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
