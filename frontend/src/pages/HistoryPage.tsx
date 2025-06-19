// frontend/src/pages/HistoryPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Importe a instância axios configurada
// Importe Link ou useNavigate se precisar de navegação
import { Link, useNavigate } from 'react-router-dom';
// Importe useAuth para obter o usuário logado (não necessário para buscar histórico, mas pode ser útil para UX)
// import { useAuth } from '../context/AuthContext';

// Reutilize ou defina interfaces para os dados de histórico
// Baseado no schema HistoricoReservaRead do backend
interface HistoricoReservaData {
  id: number; // ID do histórico (mesmo ID da reserva original)
  ambiente_id: number; // ID do ambiente no histórico
  usuario_id: string; // ID do usuário no histórico (UUID como string)
  data_inicio: string; // ISO 8601 string
  data_fim: string;    // ISO 8601 string
  data_criacao: string; // Data de criação da solicitação original
  status: 'pendente' | 'confirmada' | 'cancelada' | 'finalizada'; // Status final da reserva
  motivo: string;
  // Nota: HistoricoReservaRead NÃO inclui dados aninhados de Usuario ou Ambiente
  // porque esses objetos podem não existir mais. Exibe apenas os IDs.
}


function HistoryPage() { // Renomeado
  // const navigate = useNavigate(); // Opcional se precisar de navegação
  // const { user, loading: authLoading } = useAuth(); // Opcional se precisar de dados do usuário logado


  // State para armazenar a lista de registros de histórico
  const [historico, setHistorico] = useState<HistoricoReservaData[]>([]);
  // State para lidar com estado de carregamento
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros
  const [error, setError] = useState<string | null>(null);


  // useEffect para buscar a lista de histórico de reservas pessoais
  useEffect(() => {
    const fetchMyHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Chama o endpoint GET /reservas/historico/me
        // Este endpoint já filtra pelo usuário logado no backend.
        // Requer autenticação (qualquer usuário logado). O interceptor adicionará o token.
        const response = await api.get('/reservas/historico/me');

        setHistorico(response.data);
        console.log('Lista de histórico de reservas pessoais obtida:', response.data);

      } catch (err: any) {
        console.error('Erro ao obter histórico de reservas:', err);
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar histórico de reservas.';
        setError(errorMessage);
         // O interceptor 401 já redireciona para login.
      } finally {
        setLoading(false);
      }
    };

    // Roda a busca quando o componente é montado.
    // Não precisa de dependência do user aqui, pois o endpoint já filtra pelo logado.
    fetchMyHistory();
  }, []); // Roda apenas uma vez ao montar


  // **NOVA LÓGICA:** Função auxiliar para formatar data/hora assumindo fuso horário LOCAL (para inicio/fim)
  const formatDateTimeLocal = (dateTimeString: string) => {
       try {
           // Assumindo que a string já representa o horário no fuso horário LOCAL (UTC-3)
           // new Date(string sem info de fuso) é interpretado no fuso horário LOCAL.
           const date = new Date(dateTimeString);
           // toLocaleString formata essa data local para exibição local.
           return date.toLocaleString(); // Formato local completo (data e hora)
       } catch (e) {
            console.error("Erro ao formatar data/hora local:", dateTimeString, e);
            return "Data/Hora inválida";
       }
   };

   // **NOVA LÓGICA:** Função auxiliar para formatar data/hora assumindo UTC (para criação)
   const formatDateTimeUtc = (dateTimeString: string) => {
        try {
            // Assumindo que a string representa horário em UTC e não tem info de fuso ('Z').
            // Adicionar 'Z' força new Date() a interpretar como UTC antes de converter para local.
            const date = new Date(dateTimeString + 'Z'); // <--- Adiciona 'Z'
             // toLocaleString então converte essa data (agora interpretada como UTC) para o fuso horário LOCAL para exibição.
             return date.toLocaleString(); // Formato amigável no fuso horário LOCAL
         } catch (e) {
             console.error("Erro ao formatar data/hora UTC:", dateTimeString, e);
             return "Data/Hora inválida";
         }
    };


  // Renderização condicional
  if (loading) {
    return <div>Carregando histórico de reservas...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h1>Meu Histórico de Reservas</h1>

      {/* Exibir a lista de registros de histórico */}
      {historico.length > 0 ? (
        <ul>
          {historico.map(registro => (
            <li key={registro.id}>
              {/* Exibir detalhes do registro de histórico */}
              {/* Note que não temos dados aninhados de usuário/ambiente, apenas IDs */}
              <strong>Reserva ID Original: {registro.id}</strong> (Status Final: {registro.status.toUpperCase()})
              <p>Ambiente ID: {registro.ambiente_id}</p> {/* Exibe apenas o ID do ambiente */}
              <p>Período: {formatDateTimeLocal(registro.data_inicio)} a {formatDateTimeLocal(registro.data_fim)}</p>
              <p>Motivo: {registro.motivo}</p>
              <p>Solicitada originalmente em: {formatDateTimeUtc(registro.data_criacao)}</p>
              {/* Opcional: Exibir o ID do usuário que solicitou (o usuário logado) */}
              {/* <p>Usuário Solicitante ID: {registro.usuario_id}</p> */}

              {/* TODO: Adicionar mais detalhes se necessário */}
            </li>
          ))}
        </ul>
      ) : (
        // Mensagem se não houver histórico
        <p>Você não tem registros no histórico de reservas.</p>
      )}

      {/* TODO: Adicionar link ou botão para voltar */}
       <p>
         {/* Decida para onde voltar: lista de minhas reservas ou início */}
         <Link to="/minhas-reservas">Voltar para Minhas Reservas</Link> | <Link to="/home">Voltar para o início</Link>
       </p>

    </div>
  );
}

export default HistoryPage;