import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setThemeExplicitly: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Attempt to persist to user profile if logged in
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.put('/users/me/preferences', { themePreference: newTheme });
      } catch (err) {
        console.error('Failed to save theme preference', err);
      }
    }
  };

  const setThemeExplicitly = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeExplicitly }}>
      {children}
    </ThemeContext.Provider>
  );
};
