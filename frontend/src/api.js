// src/lib/api.js
import axios from 'axios';

// 🔴 TROQUE pelo SEU domínio do backend no Railway (sem /api e sem / no fim)
const BASE = (import.meta.env.VITE_API_URL || 'https://acalantoapp-production.up.railway.app').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    '';
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if ((config.method || 'get').toLowerCase() === 'get') {
    // cache-buster e desarma ETag/Last-Modified para evitar 304
    config.params = { ...(config.params || {}), _: Date.now() };
    config.headers['If-None-Match'] = '';
    config.headers['If-Modified-Since'] = '0';
  }
  return config;
});

// 👉 Logs para você conferir no Console do navegador
console.log('[VITE_API_URL]', import.meta.env.VITE_API_URL);
console.log('[api.baseURL]', api.defaults.baseURL);

export default api;
