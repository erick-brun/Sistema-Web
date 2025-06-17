// frontend/src/pages/ManageReservasPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
// Importe useAuth para obter o usuário logado (para verificar se é admin)
import { useAuth } from '../context/AuthContext';
// Importe Link ou useNavigate se precisar de navegação
import { Link, useNavigate } from 'react-router-dom';
// Importe useSearchParams para filtros na URL (opcional)
// import { useSearchParams } from 'react-router-dom';

import { Button, Typography } from '@mui/material'; // Importando Button para o botão "Novo Ambiente"

// Importe Date/Time Picker (se usar para filtros de data)
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';


// Reutilize interfaces para os dados de reserva e aninhados (já definidas em MyReservasPage)
interface UsuarioReadData { id: string; nome: string; email: string; /* ... */ }
interface AmbienteReadData { id: number; nome: string; /* ... */ }

// Reutilize a interface ReservaData (já definida em MyReservasPage)
interface ReservaData {
  id: number;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  data_criacao: string;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'finalizada';
  usuario: UsuarioReadData; // Dados aninhados
  ambiente: AmbienteReadData; // Dados aninhados
  // ... outros campos
}

// TODO: Definir interfaces para filtros (se forem complexos)
// interface ReservaFilters {
//     usuario_id?: string;
//     ambiente_id?: number;
//     status?: string; // Ou o tipo do Enum string
//     data_inicio_ge?: string;
//     // ... outros filtros de data
// }


function ManageReservasPage() { // Renomeado
  const navigate = useNavigate();
  // Obtenha o usuário logado do contexto (para verificar se é admin)
  const { user, loading: authLoading } = useAuth();

  // TODO: State para armazenar a lista de RESERVAS (todas)
  const [reservas, setReservas] = useState<ReservaData[]>([]);
  // TODO: State para gerenciar filtros (opcional, pode usar search params também)
  // const [filters, setFilters] = useState<ReservaFilters>({});

  // TODO: State para lidar com estado de carregamento (lista e ações)
  const [loadingReservas, setLoadingReservas] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // TODO: State para controlar qual reserva está sendo modificada (status/deleção)
  const [modifyingReservaId, setModifyingReservaId] = useState<number | null>(null);


  // TODO: useEffect para buscar a lista COMPLETA de reservas (requer Admin)
  // Receberá filtros como Query parameters
  const fetchAllReservas = async () => {
     // Verifica se o usuário logado é admin antes de tentar buscar a lista
     if (user?.tipo !== 'admin') {
         setError("Acesso negado. Esta página é apenas para administradores.");
         setLoadingReservas(false);
         return;
     }

     try {
       setLoadingReservas(true);
       setError(null);

       // Chama o endpoint GET /reservas/
       // Esta rota permite que Admin liste TODAS (sem filtro usuario_id) ou filtre por usuario_id.
       // O interceptor do axios adicionará o token.
       const response = await api.get('/reservas/', {
         params: {
           // TODO: Adicionar filtros do estado/search params aqui:
           // usuario_id: filters.usuario_id,
           // ambiente_id: filters.ambiente_id,
           // status: filters.status,
           // ... outros filtros de data ...
           // skip: 0, // Implementar paginação se necessário
           // limit: 100, // Implementar paginação se necessário
         }
       });

       setReservas(response.data);
       console.log('Lista completa de reservas (Admin) obtida:', response.data);

     } catch (err: any) {
       console.error('Erro ao obter lista de reservas (Admin):', err);
       const errorMessage = err.response?.data?.detail || 'Erro ao carregar lista de reservas.';
       setError(errorMessage);
     } finally {
       setLoadingReservas(false);
     }
  };

  // useEffect para buscar a lista na montagem inicial ou quando filtros/tipo de usuário mudam
  useEffect(() => {
     if (!authLoading) { // Garante que o estado de autenticação inicial foi carregado
        // **Importante:** A busca só deve rodar se o usuário logado for admin.
        // A checagem no início de fetchAllReservas() lida com isso,
        // mas pode ser útil adicionar uma checagem aqui também se a lógica de filtros depender do usuário ser admin.
        if (user?.tipo === 'admin') {
             setLoadingReservas(true); // Inicia o loading da lista
             fetchAllReservas().finally(() => setLoadingReservas(false)); // Busca a lista e finaliza o loading
        } else {
             // Se o usuário não é admin, apenas define o loading como false e exibe a mensagem de acesso negado
             setLoadingReservas(false);
        }
     }
  }, [user?.tipo, authLoading]); // Depende do tipo de usuário e estado de carregamento do contexto
  // TODO: Adicionar filtros como dependências aqui se implementar filtros dinâmicos


  // TODO: Adicionar lógica para lidar com filtros (opcional, se usar estados/search params)
  // const handleFilterChange = (filterName: keyof ReservaFilters, value: any) => {
  //     setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
  // };
  // const handleApplyFilters = () => {
  //     fetchAllReservas(); // Rebusca a lista com os novos filtros
  // };


  // TODO: Adicionar funções para lidar com ações (Atualizar Status, Deletar)
  // Estas funções serão chamadas pelos botões na lista.

  // Função para lidar com a ação de Atualizar Status de Reserva (por Admin)
  // Aceita o ID da reserva E o NOVO STATUS desejado.
  const handleUpdateStatus = async (reservaId: number, newStatus: ReservaData['status']) => { // Usa o tipo literal do status
       // TODO: Adicionar confirmação se necessário, especialmente para CANCELADA/FINALIZADA
        if (!window.confirm(`Tem certeza que deseja mudar o status da reserva ${reservaId} para "${newStatus.toUpperCase()}"?`)) {
            return;
        }

       setModifyingReservaId(reservaId); // Desabilita botões para esta reserva
       setError(null); // Limpa erros
       setSuccessMessage(null); // Limpa mensagens de sucesso


       try {
          // Chama o endpoint PATCH /reservas/{reserva_id}/status (requer Admin)
          // Envia o novo status no corpo JSON { "novo_status": "..." }
          const response = await api.patch(`/reservas/${reservaId}/status`, { novo_status: newStatus }); // Usa 'novo_status'
          console.log(`Status da reserva ${reservaId} atualizado para "${newStatus}":`, response.data);

          // Atualiza a lista local para refletir a mudança de status (ou remoção se foi cancelada/finalizada)
          // Como o backend deleta da tabela principal para CANCELADA/FINALIZADA,
          // fetchAllReservas() é a forma mais simples de atualizar a lista.
          await fetchAllReservas(); // Rebusca a lista completa

          setSuccessMessage(`Status da reserva ${reservaId} atualizado para "${newStatus.toUpperCase()}"!`);

       } catch (err: any) {
          console.error(`Erro ao atualizar status da reserva ${reservaId} para "${newStatus}":`, err);
          const errorMessage = err.response?.data?.detail || 'Erro ao atualizar status da reserva.';
          setError(errorMessage);
          // Lida com 403 (não admin), 404 (reserva não encontrada), 400 (transição inválida)
       } finally {
          setModifyingReservaId(null);
       }
  };

  // Função para lidar com a ação de Deletar Reserva (por Admin)
  // Nota: Removemos o endpoint DELETE direto anteriormente. Se você o readicionou, use esta chamada.
  // Se você decidiu NÃO ter um endpoint DELETE direto (apenas cancelamento/finalização), pule esta função.
  const handleDelete = async (reservaId: number) => {
      // TODO: Adicionar confirmação
      if (!window.confirm(`Tem certeza que deseja deletar a reserva ${reservaId} permanentemente?`)) {
          return;
      }

      setModifyingReservaId(reservaId); // Desabilita botões

      try {
         // **Se você readicionou o endpoint DELETE no backend:**
         // Chama o endpoint DELETE /reservas/{reserva_id} (requer Admin)
         // const response = await api.delete(`/reservas/${reservaId}`);
         // console.log(`Reserva ${reservaId} deletada permanentemente:`, response.data);

         // TODO: Lógica de verificação de reservas associadas se o DELETE no backend NÃO mover para histórico e deixar a FK
         // (Você implementou isso para Usuários e Ambientes). Mas para Reservas, a restrição FK é para Usuário e Ambiente,
         // não para outras Reservas. O problema aqui seria se houver registros no HISTÓRICO com FK de volta para a Reserva original (o que não é o caso no seu modelo).
         // O backend RESTRICT no DELETE de Reserva seria se outras tabelas referenciassem Reserva, o que não parece ser o caso.

         // **Se você não readicionou o endpoint DELETE no backend, esta função NÃO SERÁ USADA.**
         // A "deleção" no seu fluxo é via status CANCELADA/FINALIZADA que move para histórico e deleta da tabela principal.

         // Se você readicionou DELETE e ele apenas deleta da tabela principal:
         // Remove a reserva deletada da lista local
         // setReservas(reservas.filter(reserva => reserva.id !== reservaId));
         // setSuccessMessage(`Reserva ${reservaId} deletada permanentemente!`);

         // **Alternativa:** Se o "Deletar" for apenas um alias para "Cancelar" para Admins:
         // Chamar handleUpdateStatus(reservaId, 'cancelada');

         console.log(`Funcionalidade Deletar Reserva ${reservaId} não implementada ou removida.`); // Placeholder se o DELETE não existe.
         setModifyingReservaId(null); // Finaliza modificação
         // TODO: Lidar com este cenário na UI - talvez ocultar o botão se o DELETE não for suportado.

      } catch (err: any) {
         console.error(`Erro ao deletar reserva ${reservaId}:`, err);
         const errorMessage = err.response?.data?.detail || 'Erro ao deletar reserva.';
         setError(errorMessage);
      } finally {
         setModifyingReservaId(null);
      }
   };


  // Função auxiliar para formatar datas (reutilizada)
  const formatDateTime = (dateTimeString: string) => {
      const date = new Date(dateTimeString);
      return date.toLocaleString(); // Formato amigável
  };


  // Renderização condicional baseada no estado de carregamento do Contexto OU da lista de reservas
  if (authLoading || loadingReservas) { // Usar loadingReservas
    return <div>Carregando gerenciamento de reservas...</div>;
  }

  // Verificar se o usuário logado é admin
  if (user?.tipo !== 'admin') {
       return <div>Acesso negado. Esta página é apenas para administradores.</div>;
  }

  // Exibir erro se houver e não estiver carregando
  if (error && !loadingReservas) { // Usar loadingReservas
    return <div style={{ color: 'red' }}>{error}</div>;
  }


  return (
    <div>
      <h1>Gerenciar Todas as Reservas (Admin)</h1>

      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* TODO: Adicionar filtros (dropdowns, date pickers) aqui */}


      {/* Exibir a lista de reservas */}
      {reservas.length > 0 ? (
        <table> {/* Usar uma tabela */}
          <thead>
            <tr>
              <th>ID</th>
              <th>Ambiente</th>
              <th>Usuário</th> {/* Adicionado coluna Usuário */}
              <th>Período</th>
              <th>Motivo</th>
              <th>Status</th>
              <th>Solicitada Em</th>
              <th>Ações</th> {/* Coluna para botões */}
            </tr>
          </thead>
          <tbody>
            {reservas.map(reserva => (
              <tr key={reserva.id}>
                <td>{reserva.id}</td>
                <td>{reserva.ambiente.nome}</td> {/* Exibir nome do ambiente aninhado */}
                <td>{reserva.usuario.nome}</td> {/* Exibir nome do usuário aninhado */}
                <td>{formatDateTime(reserva.data_inicio)} a {formatDateTime(reserva.data_fim)}</td>
                <td>{reserva.motivo}</td>
                <td>{reserva.status.toUpperCase()}</td> {/* Exibir status */}
                 <td>{formatDateTime(reserva.data_criacao)}</td>
                <td>
                   {/* Ações para Admins */}

                   {/* TODO: Botão para Atualizar Status (Dropdown ou botões específicos) */}
                   {/* Ex: <Select value={reserva.status} onChange={(e) => handleUpdateStatus(reserva.id, e.target.value as ReservaData['status'])}>
                           {['pendente', 'confirmada', 'cancelada', 'finalizada'].map(statusOption => (
                              <MenuItem key={statusOption} value={statusOption}>{statusOption.toUpperCase()}</MenuItem>
                           ))}
                        </Select> */}

                   {/* Opcional: Botões específicos para mudar status comum (Confirmar, Cancelar) */}
                    {reserva.status === 'pendente' && ( // Se for pendente, mostrar Confirmar/Cancelar
                        <>
                            <Button variant="outlined" size="small" onClick={() => handleUpdateStatus(reserva.id, 'confirmada')}>Confirmar</Button>
                            {' '}
                            <Button variant="outlined" size="small" color="error" onClick={() => handleUpdateStatus(reserva.id, 'cancelada')}>Cancelar</Button>
                        </>
                    )}
                     {reserva.status === 'confirmada' && ( // Se for confirmada, mostrar Finalizar/Cancelar
                        <>
                            <Button variant="outlined" size="small" onClick={() => handleUpdateStatus(reserva.id, 'finalizada')}>Finalizar</Button>
                            {' '}
                            <Button variant="outlined" size="small" color="error" onClick={() => handleUpdateStatus(reserva.id, 'cancelada')}>Cancelar</Button>
                        </>
                     )}
                     {reserva.status === 'cancelada' && ( // Se for cancelada, talvez mostrar opção para reverter (se regra permitir) ou nada
                         <Typography variant="body2" color="textSecondary">Cancelada</Typography>
                     )}
                     {reserva.status === 'finalizada' && ( // Se for finalizada, talvez mostrar opção para reverter (se regra permitir) ou nada
                         <Typography variant="body2" color="textSecondary">Finalizada</Typography>
                     )}


                   {' '} {/* Espaço */}

                   {/* TODO: Botão para Deletar (se mantido) */}
                    {/* Se você manteve o endpoint DELETE direto para admin, adicione o botão aqui. */}
                    {/* Ex: <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(reserva.id)} disabled={modifyingReservaId === reserva.id}>Deletar</Button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Nenhuma reserva encontrada.</p>
      )}

      {/* TODO: Adicionar funcionalidade de paginação ou filtros aqui */}
       <p></p>
       {/* Link para voltar */}
        <p><Link to="/home">Voltar para o início</Link></p>
    </div>
  );
}

export default ManageReservasPage;