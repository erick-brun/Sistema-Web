// frontend/src/pages/Home.tsx

import React, { useEffect, useState } from 'react'; // Importe useEffect e useState
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; // Importe a instância axios configurada

// Baseado no schema UsuarioRead do backend
interface UsuarioData {
  id: string; // UUID como string no frontend
  nome: string;
  email: string;
  tipo: 'user' | 'admin'; // Use os tipos do Enum do backend
  ativo: boolean;
  data_criacao: string; // Datas geralmente vêm como string ISO 8601
  // Adicione outros campos do UsuarioRead se precisar
}


function HomePage() {
  const navigate = useNavigate();
  // State para armazenar os dados do usuário logado
  const [userData, setUserData] = useState<UsuarioData | null>(null);
  // State para lidar com estado de carregamento (opcional, mas boa prática)
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros na busca dos dados (menos provável devido ao interceptor 401)
  const [error, setError] = useState<string | null>(null);


  // useEffect para executar a busca dos dados do usuário quando o componente é montado
  useEffect(() => {
    // Função assíncrona para buscar os dados do usuário logado
    const fetchUserData = async () => {
      try {
        setLoading(true); // Inicia o estado de carregamento
        setError(null); // Limpa erros anteriores

        // Chama o endpoint protegido GET /usuarios/me
        // O interceptor do axios em api.ts adicionará automaticamente o header Authorization
        const response = await api.get('/usuarios/me');

        // Armazena os dados do usuário recebidos no state
        setUserData(response.data);
        console.log('Dados do usuário logado obtidos:', response.data); // Log para verificar

      } catch (err: any) {
        // Se ocorrer um erro (exceto 401, que é tratado pelo interceptor), exibe mensagem
        console.error('Erro ao obter dados do usuário:', err);
        // O interceptor 401 já redireciona para login.
        // Este catch lidaria com outros erros (400, 403, 404, 500).
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar dados do usuário.';
        setError(errorMessage);
        // Se o erro for 403 e a rota exigir admin, você pode querer exibir uma mensagem específica.
      } finally {
        setLoading(false); // Finaliza o estado de carregamento
      }
    };

    // Chama a função de busca quando o componente é montado ([])
    fetchUserData();
  }, []); // O array vazio [] garante que este useEffect roda apenas uma vez ao montar o componente


  // Função para lidar com o logout (como antes)
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    console.log('Logout bem-sucedido. Redirecionando para /login...');
    navigate('/login');
  };

  // Renderização condicional baseada no estado de carregamento e erro
  if (loading) {
    return <div>Carregando dados do usuário...</div>; // Exibe mensagem de carregamento
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>; // Exibe mensagem de erro
  }

  // Se não estiver carregando e não houver erro, e userData existir, exibe o conteúdo principal.
  return (
    <div>
      <h1>Bem-vindo ao Painel de Reservas!</h1>

      {/* Exibir dados do usuário logado */}
      {userData && ( // Verifica se userData não é null
        <div>
          <h2>Olá, {userData.nome}!</h2> {/* Exibe o nome do usuário */}
          <p>Email: {userData.email}</p>
          <p>Tipo de Usuário: {userData.tipo}</p>
          {/* Opcional: Mostrar outras informações do usuário */}
        </div>
      )}

      <p>Esta é a página inicial protegida.</p>

      {/* Links para outras páginas protegidas */}
      <nav> {/* Use nav para um bloco de navegação */}
         <ul>
            <li><Link to="/ambientes">Ver Ambientes Disponíveis</Link></li>
            <li><Link to="/solicitar-reserva">Solicitar Nova Reserva</Link></li> {/* <-- Link para a nova página */}
            <li><Link to="/minhas-reservas">Ver Minhas Reservas</Link></li>
            <li><Link to="/calendario">Ver Calendário de Reservas</Link></li>
            {/* TODO: Adicionar links para páginas de administração se o usuário for admin */}
         </ul>
      </nav>


      {/* TODO: Adicionar conteúdo real do dashboard aqui (ex: resumo das próximas reservas) */}


      {/* Botão de Logout */}
      <button onClick={handleLogout}>Sair (Logout)</button>
    </div>
  );
}

export default HomePage;