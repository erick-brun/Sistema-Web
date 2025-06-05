// frontend/src/pages/MyReservasPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Importe a instância axios configurada
// Importe Link ou useNavigate se precisar de navegação
import { Link, useNavigate } from 'react-router-dom';

// Reutilize ou defina interfaces para os dados aninhados
// Requer que UsuarioRead e AmbienteRead tenham sido definidos como interfaces
interface UsuarioReadData {
  id: string; // UUID como string no frontend
  nome: string;
  email: string;
  // ... outros campos do UsuarioRead
}

interface AmbienteReadData {
  id: number; // ID do ambiente
  nome: string;
  // ... outros campos do AmbienteRead
}

// Definir uma interface para a estrutura dos dados da reserva
// Baseado no schema ReservaRead do backend
interface ReservaData {
  id: number; // ID da reserva
  data_inicio: string; // Datas geralmente vêm como string ISO 8601
  data_fim: string;
  motivo: string;
  data_criacao: string;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'finalizada'; // Use os tipos do Enum
  // Inclui os dados aninhados de usuário e ambiente
  usuario: UsuarioReadData;
  ambiente: AmbienteReadData;
  // ... outros campos do ReservaRead se precisar
}


function MyReservasPage() { // Renomeado
  // State para armazenar a lista de reservas do usuário
  const [reservas, setReservas] = useState<ReservaData[]>([]);
  // State para lidar com estado de carregamento
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros
  const [error, setError] = useState<string | null>(null);

  // useEffect para buscar a lista de reservas do usuário logado
  useEffect(() => {
    const fetchMyReservas = async () => {
      try {
        setLoading(true); // Inicia o carregamento
        setError(null); // Limpa erros

        // Precisamos obter o ID do usuário logado para filtrar as reservas.
        // O ID do usuário logado pode vir do state na página Home (se passado como prop)
        // ou pode ser obtido chamando GET /usuarios/me aqui novamente.
        // A forma mais comum é armazenar informações básicas do usuário logado
        // em um contexto global ou state management ao fazer login.
        // Para simplificar agora, vamos assumir que você pode obter o ID do usuário
        // (ex: do LocalStorage, ou de um Context).
        // NOTA: A rota GET /reservas/ exige ADMIN para listar TODAS.
        // Precisamos chamar essa rota com o filtro `usuario_id`.
        // Se o usuário logado for USER, o backend deve permitir filtrar SOMENTE pelo seu próprio ID.
        // A rota no backend (GET /reservas/) atualmente exige ADMIN para QUALQUER filtro.
        // **AJUSTE NECESSÁRIO NO BACKEND:** A rota GET /reservas/ deve permitir que
        // um usuário comum (não admin) a acesse APENAS se o filtro usuario_id FOR O SEU PRÓPRIO ID.
        // Um admin pode acessar e usar QUALQUER filtro usuario_id.
        // Por enquanto, assumimos que a rota GET /reservas/ permite essa lógica no backend.

        // Obter o ID do usuário logado (ex: armazenado ao fazer login, ou de um Context API)
        // Para este exemplo, vamos assumir que você pode obter o ID do usuário logado de alguma forma.
        // Se você armazenou o objeto completo UsuarioRead no LocalStorage/Context, pode obter o ID de lá.
        // Ex: const userData = JSON.parse(localStorage.getItem('userData') || 'null');
        // const userId = userData?.id;
        // Se apenas o token está no LocalStorage, você teria que decodificar o token (frontend não é seguro para isso)
        // ou fazer GET /usuarios/me novamente (menos eficiente).
        // **Melhor Abordagem:** Armazenar o ID do usuário logado (ou o objeto básico UsuarioRead) no LocalStorage/Context ao fazer login.

        // Vamos assumir que o ID do usuário logado está disponível.
        // Substitua 'SEU_ID_DE_USUARIO_LOGADO' pela forma real de obtê-lo.
        const userId = localStorage.getItem('loggedInUserId'); // Exemplo: armazenar o ID ao fazer login

        if (!userId) {
             setError("ID do usuário logado não disponível.");
             setLoading(false);
             // Opcional: redirecionar para login se não conseguir obter o ID do usuário logado
             // navigate('/login');
             return;
        }

        // Chama o endpoint para listar as reservas, filtrando pelo ID do usuário logado.
        // Requer autenticação. A rota GET /reservas/ exige ADMIN por padrão (verificar backend).
        // Se a lógica de permissão no backend não permitir USER filtrar por si mesmo, este teste falhará com 403.
        const response = await api.get('/reservas/', {
          params: {
            usuario_id: userId, // Passa o ID do usuário logado como query parameter
            // Opcional: adicionar outros filtros aqui (por status, datas, etc.)
            // status: 'pendente' // Ex: listar apenas pendentes
          }
        });

        // Armazena a lista de reservas no state
        setReservas(response.data);
        console.log('Lista de reservas do usuário obtida:', response.data); // Log

      } catch (err: any) {
        console.error('Erro ao obter lista de reservas:', err);
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar lista de reservas.';
        setError(errorMessage);
         // O interceptor 401 já redireciona para login.
         // Este catch lida com outros erros (ex: 403 Forbidden se USER não puder filtrar por si mesmo).
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    fetchMyReservas();
  }, []); // O array vazio [] garante que roda apenas uma vez ao montar


  // Função auxiliar para formatar datas para exibição
  const formatDateTime = (dateTimeString: string) => {
      const date = new Date(dateTimeString);
      return date.toLocaleString(); // Formato amigável de data e hora
  };


  // Renderização condicional
  if (loading) {
    return <div>Carregando minhas reservas...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h1>Minhas Reservas</h1>

      {/* Exibir a lista de reservas */}
      {reservas.length > 0 ? (
        <ul>
          {reservas.map(reserva => (
            <li key={reserva.id}>
              {/* Exibir detalhes da reserva */}
              <strong>Reserva ID: {reserva.id}</strong> (Status: {reserva.status.toUpperCase()})
              <p>Ambiente: {reserva.ambiente.nome}</p> {/* Acessando dado aninhado */}
              <p>Período: {formatDateTime(reserva.data_inicio)} a {formatDateTime(reserva.data_fim)}</p> {/* Formatando datas */}
              <p>Motivo: {reserva.motivo}</p>
              <p>Solicitada em: {formatDateTime(reserva.data_criacao)}</p>
              {/* Opcional: Exibir o nome do usuário que solicitou (se ReservaRead inclui UsuarioRead) */}
              {/* <p>Solicitado por: {reserva.usuario.nome}</p> */} {/* Acessando dado aninhado */}

              {/* TODO: Adicionar botões para Editar/Cancelar (se status for PENDENTE e for o dono) */}
            </li>
          ))}
        </ul>
      ) : (
        // Mensagem se não houver reservas
        <p>Você não tem nenhuma reserva cadastrada.</p>
      )}

      {/* TODO: Adicionar link ou botão para solicitar uma nova reserva */}
    </div>
  );
}

export default MyReservasPage;