// frontend/src/pages/Home.tsx

import React from 'react'; // Não precisa mais de useEffect, useState para userData, loading, error
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- Importe useAuth


function HomePage() {
  const navigate = useNavigate();
  // Obtenha o usuário logado e a função logout do contexto
  const { user, logout, loading } = useAuth(); // <--- Obtenha user, logout, loading do contexto

  // Não precisa mais do useEffect para fetchUserData
  // Não precisa mais dos states userData, loading, error

  // Função para lidar com o logout (chama a função do contexto)
  const handleLogout = () => {
    logout(); // <--- Chame a função logout do contexto
    // O contexto logout cuidará de limpar o storage e o estado,
    // e ProtectedRoute/useEffect em Login cuidará do redirecionamento.
  };


  // Renderização condicional baseada no estado de carregamento DO CONTEXTO
  // O contexto começa como loading=true para carregar estado inicial do storage.
  if (loading) {
     // Opcional: Renderizar algo enquanto o contexto carrega o estado inicial
     return <div>Carregando estado de autenticação...</div>;
  }

  // Nota: Se o usuário não estivesse autenticado, ProtectedRoute já teria redirecionado.
  // Portanto, se chegamos aqui, user DEVE ser != null (a menos que haja um bug no contexto/ProtectedRoute).
  // Mas é seguro verificar.

  return (
    <div>
      <h1>Bem-vindo ao Painel de Reservas!</h1>

      {/* Exibir dados do usuário logado DO CONTEXTO */}
      {user && ( // Verifica se user não é null
        <div>
          <h2>Olá, {user.nome}!</h2> {/* Exibe o nome do usuário */}
          <p>Email: {user.email}</p>
          <p>Tipo de Usuário: {user.tipo}</p>
          {/* Opcional: Mostrar outras informações do usuário */}
        </div>
      )}

      <p>Esta é a página inicial protegida.</p>

      {/* Links para outras páginas protegidas */}
      <nav>
         <ul>
            <li><Link to="/ambientes">Ver Ambientes Disponíveis</Link></li>
            <li><Link to="/solicitar-reserva">Solicitar Nova Reserva</Link></li>
            <li><Link to="/minhas-reservas">Ver Minhas Reservas</Link></li>
            <li><Link to="/calendario">Ver Calendário de Reservas</Link></li>
            {/* TODO: Adicionar links para páginas de administração se o usuário for admin (usando user.tipo) */}
            {user?.tipo === 'admin' && ( // <--- Exemplo de restrição visual para admin
                <> {/* Fragmento React */}
                   <li><Link to="/gerenciar-usuarios">Gerenciar Usuários</Link></li>
                   <li><Link to="/gerenciar-ambientes">Gerenciar Ambientes</Link></li>
                   <li><Link to="/gerenciar-reservas">Gerenciar Todas as Reservas</Link></li>
                   <li><Link to="/historico-reservas">Ver Histórico de Reservas</Link></li>
                </>
            )}
         </ul>
      </nav>


      {/* TODO: Adicionar conteúdo real do dashboard aqui */}


      {/* Botão de Logout */}
      <button onClick={handleLogout}>Sair (Logout)</button>
    </div>
  );
}

export default HomePage;