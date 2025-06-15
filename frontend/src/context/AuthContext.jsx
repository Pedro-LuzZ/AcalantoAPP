// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken')); // Pega o token do localStorage ao iniciar

  // Efeito para carregar dados do usuário se um token já existir
  useEffect(() => {
    if (token) {
      // Se temos um token, configuramos o cabeçalho do axios para todas as requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Também podemos buscar os dados do usuário ou apenas pegá-los do localStorage
      const usuarioSalvo = localStorage.getItem('user');
      if (usuarioSalvo) {
        setUsuario(JSON.parse(usuarioSalvo));
      }
    }
  }, [token]);

  // Função de Login REAL
  const login = async (email, senha) => {
    try {
      const response = await axios.post('http://localhost:3001/api/usuarios/login', {
        email,
        senha,
      });

      // Se o login for bem-sucedido
      const { token, usuario } = response.data;

      // 1. Guarda o token e os dados do usuário no localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(usuario));

      // 2. Configura o cabeçalho padrão do axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 3. Atualiza os estados globais
      setToken(token);
      setUsuario(usuario);

    } catch (error) {
      console.error("Erro no login no AuthContext:", error);
      // Limpa qualquer dado antigo em caso de falha
      logout();
      // Lança o erro para que a LoginPage possa tratá-lo
      throw error;
    }
  };

  // Função de Logout
  const logout = () => {
    // Limpa os dados do localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Limpa o cabeçalho do axios
    delete axios.defaults.headers.common['Authorization'];

    // Limpa os estados globais
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