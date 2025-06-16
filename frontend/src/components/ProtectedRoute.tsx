// frontend/src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- Importe useAuth


interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Obtenha o estado de autenticação e carregamento do contexto
  const { isAuthenticated, loading } = useAuth(); // <--- Obtenha do contexto

  // Se o estado de autenticação inicial ainda está carregando, renderize um loading (opcional)
  if (loading) {
     return <div>Verificando autenticação...</div>; // Ou um spinner, etc.
  }

  // Se NÃO estiver autenticado (e não estiver mais carregando), redireciona para a página de login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se ESTIVER autenticado, renderiza os elementos filhos.
  return <>{children}</>;
};

export default ProtectedRoute;