import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { ThemeContext } from './ThemeContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setThemeExplicitly } = useContext(ThemeContext);

  useEffect(() => {
    // Strict security constraint: No localStorage/sessionStorage.
    // Session is only valid in memory for the duration of this page load.
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const payload = res.data.data || res.data;
    
    // Inject token directly into Axios defaults for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`;
    
    setUser(payload);
    if (payload?.themePreference) {
      setThemeExplicitly(payload.themePreference);
    }
    return payload; // return so callers can read .role for redirect
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const payload = res.data.data || res.data;
    
    api.defaults.headers.common['Authorization'] = `Bearer ${payload.token}`;
    setUser(payload);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
