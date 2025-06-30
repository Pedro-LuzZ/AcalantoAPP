import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api'; // << MUDOU

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    if (token) {
      const usuarioSalvo = localStorage.getItem('user');
      if (usuarioSalvo) {
        setUsuario(JSON.parse(usuarioSalvo));
      }
    }
  }, [token]);

  const login = async (email, senha) => {
    try {
      const response = await api.post('/usuarios/login', { // << MUDOU
        email,
        senha,
      });

      const { token, usuario } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      setToken(token);
      setUsuario(usuario);
    } catch (error) {
      logout();
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUsuario(null);
    setToken(null);
  };

  const value = {
    usuario,
    token,
    login,
    logout,
    isLoggedIn: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};