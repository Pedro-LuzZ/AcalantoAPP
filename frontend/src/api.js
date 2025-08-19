// src/lib/api.js
import axios from 'axios';

// BASE absoluta do backend (sem barra no fim). No Railway, defina VITE_API_URL
// no serviço do FRONT como: https://SEU-BACKEND.up.railway.app
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

// Injeta token e evita 304 em GET (cache buster + derruba validação condicional)
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token') ||
      '';
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if ((config.method || 'get').toLowerCase() === 'get') {
      config.params = { ...(config.params || {}), _: Date.now() }; // cache buster
      config.headers['If-None-Match'] = '';           // desarma 304 por ETag
      config.headers['If-Modified-Since'] = '0';      // idem por Last-Modified
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// (opcional) logar base usada — ajuda depurar produção
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log('[api] baseURL =>', api.defaults.baseURL);
}

export default api;
