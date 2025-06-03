// frontend/src/components/ProtectedRoute.tsx

import React from 'react';
// Importe Navigate para redirecionamento
import { Navigate } from 'react-router-dom';

// Defina as props que este componente espera (os elementos filhos que ele envolverá)
interface ProtectedRouteProps {
  children: React.ReactNode; // Representa os componentes que ProtectedRoute está protegendo
}

// Componente de Rota Protegida
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Verifica se o token de acesso existe no LocalStorage (ou onde você o armazena).
  // A simples existência do token é usada como um indicador básico de autenticação no frontend.
  // (Uma verificação mais robusta incluiria validar a expiração do token).
  const isAuthenticated = localStorage.getItem('accessToken'); // Use a mesma chave que em login.tsx

  // Se o usuário NÃO estiver autenticado (sem token), redireciona para a página de login.
  if (!isAuthenticated) {
    // Use o componente Navigate de react-router-dom para redirecionar.
    // 'replace' faz com que a página de login substitua a entrada atual no histórico do navegador.
    return <Navigate to="/login" replace />;
  }

  // Se o usuário ESTIVER autenticado (com token), renderiza os elementos filhos (a página protegida).
  return <>{children}</>; // Retorna os componentes filhos (ex: <Home />)
};

export default ProtectedRoute;