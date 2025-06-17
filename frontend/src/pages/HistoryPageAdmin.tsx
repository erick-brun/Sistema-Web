// frontend/src/pages/HistoryPageAdmin.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
// Importe useAuth para verificar se é admin e obter o usuário logado (para filtros se admin)
import { useAuth } from '../context/AuthContext';
// Importe Link ou useNavigate se precisar de navegação
import { Link, useNavigate } from 'react-router-dom';
// Importe Query parameters hook se usar filtros na URL
// import { useSearchParams } from 'react-router-dom';


// Reutilize interfaces para os dados de histórico (já definida em HistoryPage)
interface HistoricoReservaData {
  id: number;
  ambiente_id: number;
  usuario_id: string;
  data_inicio: string;
  data_fim: string;
  data_criacao: string;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'finalizada';
  motivo: string;
  nome_amb: string; // <--- ADICIONADO
  nome_usu: string; // <--- ADICIONADO
}

// TODO: Se quiser exibir nome do usuário/ambiente no histórico geral,
// a função obter_historico_reservas no backend PRECISA carregar os relacionamentos
// Usuario e Ambiente (mesmo que eles possam ser nulos no DB Histórico).
// Se o backend não carregar, você só terá os IDs (usuario_id, ambiente_id).
// Se o backend carregar (usando selectinload mesmo para Optional FKs),
// você precisará adaptar a interface HistoricoReservaData para incluir esses campos aninhados opcionais.
// Ex: usuario?: { nome: string; email: string; }; ambiente?: { nome: string; };


// TODO: Definir interfaces para filtros (se forem complexos)
// interface HistoricoFilters {
//     usuario_id?: string;
//     ambiente_id?: number;
//     status?: string; // Ou o tipo do Enum string
//     data_inicio_ge?: string;
//     // ... outros filtros de data
// }


function HistoryPageAdmin() { // Renomeado para Administradores
  const navigate = useNavigate();
  // Obtenha o usuário logado do contexto (para verificar se é admin)
  const { user, loading: authLoading } = useAuth();


  // State para armazenar a lista de registros de histórico
  const [historico, setHistorico] = useState<HistoricoReservaData[]>([]);
  // TODO: State para gerenciar filtros (opcional, pode usar search params também)
  // const [filters, setFilters] = useState<HistoricoFilters>({});

  // State para lidar com estado de carregamento
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros
  const [error, setError] = useState<string | null>(null);

  // TODO: State para armazenar a lista de usuários para popular filtro de usuário (se usar)
  // TODO: State para armazenar a lista de ambientes para popular filtro de ambiente (se usar)


  // useEffect para buscar a lista de histórico de reservas (geral)
  useEffect(() => {
    const fetchHistory = async () => {
       // Verifica se o usuário logado é admin
      if (user?.tipo !== 'admin') {
          setError("Acesso negado. Esta página é apenas para administradores.");
          setLoading(false);
          return;
      }


      try {
        setLoading(true);
        setError(null);

        // TODO: Chamar o endpoint GET /reservas/historico com FILTROS e paginação
        // Este endpoint permite filtros (usuario_id, ambiente_id, status, datas) e paginação.
        // Requer autenticação ADMIN.
        const response = await api.get('/reservas/historico', {
           params: {
             // TODO: Adicionar filtros do estado/search params aqui:
             // usuario_id: filters.usuario_id,
             // ambiente_id: filters.ambiente_id,
             // status: filters.status,
             // data_inicio_ge: filters.data_inicio_ge,
             // ... outros filtros de data ...
             skip: 0, // Implementar paginação se necessário
             limit: 100, // Implementar paginação se necessário
           }
        });

        // TODO: Adaptar os dados se o backend carregar relacionamentos aninhados (Usuario/Ambiente)
        // Se a interface HistoricoReservaData incluir campos aninhados opcionais,
        // os dados recebidos devem corresponder.

        setHistorico(response.data);
        console.log('Lista geral de histórico de reservas (Admin) obtida:', response.data);

      } catch (err: any) {
        console.error('Erro ao obter histórico geral de reservas:', err);
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar histórico de reservas.';
        setError(errorMessage);
         // Lida com 403 Forbidden (se a verificação acima falhou por algum motivo)
      } finally {
        setLoading(false);
      }
    };

    // Roda a busca quando o componente é montado OU quando filtros/tipo de usuário mudam
    if (!authLoading) { // Garante que o estado de autenticação inicial foi carregado
        fetchHistory();
    }
  }, [user?.tipo, authLoading]); // Depende do tipo de usuário e estado de carregamento do contexto
  // TODO: Adicionar filtros como dependências aqui se implementar filtros dinâmicos


  // Função auxiliar para formatar datas (reutilizada)
  const formatDateTime = (dateTimeString: string) => {
      const date = new Date(dateTimeString);
      return date.toLocaleString(); // Formato amigável
  };


  // Renderização condicional
  if (authLoading || loading) {
    return <div>Carregando histórico geral...</div>;
  }

  // Verificar se o usuário logado é admin (proteção frontend/UX)
  if (user?.tipo !== 'admin') {
       return <div>Acesso negado. Esta página é apenas para administradores.</div>;
  }

  // Exibir erro se houver e não estiver carregando
  if (error && !loading) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }


  return (
    <div>
      <h1>Histórico Geral de Reservas (Admin)</h1>

      {/* TODO: Adicionar filtros (dropdowns, date pickers) aqui */}
      {/* Ex: <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}> ... </select> */}


      {/* Exibir a lista de registros de histórico */}
      {historico.length > 0 ? (
        <table> {/* Usar uma tabela */}
          <thead>
            <tr>
                <th>ID</th>
                <th>Ambiente</th> {/* <--- COLUNA ADICIONADA */}
                <th>Usuário</th> {/* <--- COLUNA ADICIONADA */}
                {/* <th>Ambiente ID</th> Exibir ID opcionalmente */}
                {/* <th>Usuário ID</th> Exibir ID opcionalmente */}
                <th>Período</th>
                <th>Motivo</th>
                <th>Status Final</th>
                <th>Solicitada Originalmente Em</th>
                {/* TODO: Adicionar coluna para Nome Usuário e Nome Ambiente se o backend carregar */}
            </tr>
          </thead>
          <tbody>
            {historico.map(registro => (
              <tr key={registro.id}>
                <td>{registro.id}</td>
                <td>{registro.nome_amb}</td> {/* <--- EXIBIR NOME */}
                <td>{registro.nome_usu}</td> {/* <--- EXIBIR NOME */}
                {/* Opcional: Exibir IDs também se necessário */}
                {/* <td>{registro.ambiente_id}</td> */}
                {/* <td>{registro.usuario_id}</td> */}
                <td>{formatDateTime(registro.data_inicio)} a {formatDateTime(registro.data_fim)}</td>
                <td>{registro.motivo}</td>
                <td>{registro.status.toUpperCase()}</td>
                <td>{formatDateTime(registro.data_criacao)}</td>
                {/* TODO: Adicionar células para Nome Usuário e Nome Ambiente se o backend carregar */}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Nenhum registro no histórico encontrado.</p>
      )}

      {/* TODO: Adicionar funcionalidade de paginação aqui */}
       <p></p>
       {/* Link para voltar */}
        <p><Link to="/home">Voltar para o início</Link></p>
    </div>
  );
}

export default HistoryPageAdmin;