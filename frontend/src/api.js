import axios from 'axios';

// Cria uma instância do axios com configurações pré-definidas
const api = axios.create({
  // A URL base da nossa API. Se a variável de ambiente não existir, usa localhost.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// "Interceptor": uma função que é executada ANTES de cada requisição
// Isso garante que toda requisição feita pelo 'api' já terá o token de autenticação
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;