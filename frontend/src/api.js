import axios from 'axios';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const api = axios.create({ baseURL: `${BASE}/api` });

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    '';
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 🔎 LOGUE ISSO SEM IF (até corrigir)
console.log('[VITE_API_URL]', import.meta.env.VITE_API_URL);
console.log('[api.baseURL]', api.defaults.baseURL);

export default api;
