import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { initiateSocketConnection, disconnectSocket } from '../services/socket';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        initiateSocketConnection(token);
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  const login = async (identifier, password, role) => {
    try {
      const endpoint = role === 'driver' ? '/auth/login/driver' : '/auth/login/rider';
      // The backend expects "username", so we map the identifier (which might be an email from the form) to username
      const res = await api.post(endpoint, { username: identifier, password });
      
      const { token, ...userData } = res.data;
      const userObj = { ...userData, role };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      
      setUser(userObj);
      initiateSocketConnection(token);
      setError(null);
      toast.success('Logged in successfully!');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      toast.error(msg);
      return false;
    }
  };

  const register = async (userData, role) => {
    try {
      const endpoint = role === 'driver' ? '/auth/register/driver' : '/auth/register/rider';
      const res = await api.post(endpoint, userData);
      
      const { token, ...newUserData } = res.data;
      const userObj = { ...newUserData, role };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userObj));
      
      setUser(userObj);
      initiateSocketConnection(token);
      setError(null);
      toast.success('Registered successfully!');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    disconnectSocket();
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
