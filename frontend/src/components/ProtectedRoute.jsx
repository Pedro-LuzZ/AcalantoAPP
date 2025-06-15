// frontend/src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute() {
  const { isLoggedIn } = useAuth(); // Usamos nosso hook para ver se o usuário está logado

  if (!isLoggedIn) {
    // Se não estiver logado, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se estiver logado, renderiza a página que a rota deveria mostrar
  // O <Outlet /> é um placeholder para o componente da rota filha (ex: <Home />, <PatientList />)
  return <Outlet />;
}

export default ProtectedRoute;