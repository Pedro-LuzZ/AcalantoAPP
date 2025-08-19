// src/lib/api.js (ou onde fica seu api.js)
import axios from 'axios';

// BASE: VITE_API_URL SEM barra no final; fallback: localhost:3001
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const api = axios.create({
  // sempre termina com /api
  baseURL: `${BASE}/api`,
  headers: { 'Cache-Control': 'no-cache' },
});

// Interceptor: injeta Authorization com qualquer chave usada pelo app
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      '';
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
