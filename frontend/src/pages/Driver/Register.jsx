import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const DriverRegister = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register({ username, email, password }, 'driver');
    if (success) {
      navigate('/driver/dashboard');
    }
  };

  return (
    <div className="flex-center">
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        <Link to="/" style={{ position: 'absolute', top: '1rem', left: '1rem', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>← Home</Link>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '1rem' }}>Driver Registration</h2>
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required 
            />
          </div>
          <button type="submit" className="btn btn-accent">Apply to Drive</button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          Already a driver? <Link to="/driver/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
