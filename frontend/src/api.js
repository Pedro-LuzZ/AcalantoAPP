import axios from 'axios';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') || '';
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;   // <- precisa existir
