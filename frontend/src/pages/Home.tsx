// frontend/src/pages/Home.tsx

import React from 'react';
// Importe useNavigate para redirecionamento após logout
import { useNavigate } from 'react-router-dom';

function HomePage() { // Mantido o nome HomePage para consistência
  const navigate = useNavigate();

  // Função para lidar com o logout
  const handleLogout = () => {
    // Remove o token de acesso do LocalStorage
    localStorage.removeItem('accessToken');
    // Opcional: Se estiver usando refresh token, remova-o também
    // localStorage.removeItem('refreshToken');

    console.log('Logout bem-sucedido. Redirecionando para /login...');
    // Redireciona o usuário para a página de login
    navigate('/login');
  };

  return (
    <div>
      <h1>Bem-vindo ao Painel de Reservas!</h1>
      <p>Esta é a página inicial protegida.</p>
      {/* TODO: Adicionar conteúdo real do dashboard aqui */}

      {/* Botão de Logout */}
      <button onClick={handleLogout}>Sair (Logout)</button>

      {/* TODO: Adicionar links para outras páginas protegidas (Gestão de Ambientes, Minhas Reservas, etc.) */}
    </div>
  );
}

export default HomePage; // Exporte o componente