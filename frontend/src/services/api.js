import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Token is now set dynamically in AuthContext via api.defaults.headers.common
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
