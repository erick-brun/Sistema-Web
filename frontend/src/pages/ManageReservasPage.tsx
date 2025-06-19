// frontend/src/pages/ManageReservasPage.tsx

import React, { useEffect, useState, useCallback } from 'react'; // Importar useCallback
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // Para verificar se é admin
import { Link, useNavigate } from 'react-router-dom';

// Importar componentes de Material UI para tabelas, formulários e layout
import { Box, Typography, CircularProgress, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material'; // Adicionado Table components, CircularProgress, Button
// Importar componentes de formulário (se usar para filtros)
import { TextField, Select, MenuItem, FormControl, InputLabel, useTheme } from '@mui/material';
import theme from '../theme';

// Importar Date/Time Picker (se usar para filtros de data)
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// Importe para lidar com datas
import { format, parseISO, formatISO } from 'date-fns'; // Para formatar/parsear datas

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

// TODO: Definir interfaces para filtros (se forem complexos) (já definida em HistoryPageAdmin)
interface ReservaFilters {
    usuario_id?: string; // string para o UUID
    ambiente_id?: number | ''; // number ou '' para select vazio
    status?: ReservaData['status'] | ''; // string do Enum ou ''
    data_inicio_ge?: string; // ISO 8601 string
    data_inicio_le?: string;
    data_fim_ge?: string;
    data_fim_le?: string;
    nome_amb?: string; // Filtro por nome do ambiente
    nome_usu?: string; // Filtro por nome do usuário
}

// Reutilize interfaces para popular filtros de usuário e ambiente (já definidas em ManageUsersPage)
interface UsuarioData { id: string; nome: string; email: string; /* ... */ }
interface AmbienteData { id: number; nome: string; /* ... */ }


function ManageReservasPage() {
  const navigate = useNavigate();
  // Obtenha o usuário logado do contexto (para verificar se é admin)
  const { user, loading: authLoading } = useAuth();
  const theme = useTheme(); // <--- Importar useTheme

  // State para armazenar a lista de RESERVAS (todas)
  const [reservas, setReservas] = useState<ReservaData[]>([]);

  // State para gerenciar filtros
  const [filters, setFilters] = useState<ReservaFilters>({}); // Inicializa com objeto vazio (sem filtros)

  // State para popular filtros (lista de usuários e ambientes)
  const [users, setUsers] = useState<UsuarioData[]>([]);
  const [ambientesForFilter, setAmbientesForFilter] = useState<AmbienteData[]>([]); // Renomeado para evitar conflito


  // State para lidar com estado de carregamento (lista e dados dos filtros)
  const [loadingReservas, setLoadingReservas] = useState<boolean>(true); // Renomeado
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State para controlar qual reserva está sendo modificada (status/deleção)
  const [modifyingReservaId, setModifyingReservaId] = useState<number | null>(null);


  // TODO: Função para buscar a lista COMPLETA de reservas (requer Admin)
  // Receberá filtros como Query parameters
   const fetchAllReservas = useCallback(async () => { // Usar useCallback
     // Verifica se o usuário logado é admin antes de tentar buscar a lista
     if (user?.tipo !== 'admin') {
         setError("Acesso negado. Esta página é apenas para administradores.");
         setLoadingReservas(false);
         return;
     }

     try {
       setLoadingReservas(true);
       setError(null);

       // Chamar o endpoint GET /reservas/
       // Esta rota permite que Admin liste TODAS (sem filtro usuario_id) ou filtre por usuario_id.
       // O interceptor do axios adicionará o token.
       const response = await api.get('/reservas/', {
         params: {
           ...filters, // Passa todos os filtros do estado
           // Tratamento especial para status/ambiente_id/usuario_id se forem '' (o backend espera undefined ou UUID)
           status: filters.status === '' ? undefined : filters.status, // Enviar undefined se ''
           ambiente_id: filters.ambiente_id === '' ? undefined : filters.ambiente_id, // Enviar undefined se '' (number)
           usuario_id: filters.usuario_id === '' ? undefined : filters.usuario_id, // Enviar undefined se '' (string UUID)
           // TODO: Formatar datas de objetos Date (se usar date pickers) para string ISO 8601 se necessário (se o filtro for por objeto Date)
           data_inicio_ge: filters.data_inicio_ge ? formatISO(parseISO(filters.data_inicio_ge as string)) : undefined, // Exemplo: formato ISO 8601
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
  }, [user?.tipo, filters, api]); // Depende do tipo de usuário, filtros, api


  // useEffect para buscar a lista na montagem inicial ou quando filtros/tipo de usuário mudam
  useEffect(() => {
     if (!authLoading) {
        // **Importante:** A busca só deve rodar se o usuário logado for admin.
        if (user?.tipo === 'admin') {
             setLoadingReservas(true);
             fetchAllReservas().finally(() => setLoadingReservas(false));
        } else {
             // Se o usuário não é admin, apenas define o loading como false e exibe a mensagem de acesso negado
             setLoadingReservas(false);
        }
     }
  }, [user?.tipo, authLoading, fetchAllReservas]); // Depende do tipo de usuário, estado de auth, e fetchAllReservas (com useCallback)


  // useEffect para carregar dados para popular os filtros (lista de usuários e ambientes)
  // Este useEffect deve rodar APENAS UMA VEZ na montagem (ou quando o usuário ADMIN loga).
  useEffect(() => {
       if (!authLoading && user?.tipo === 'admin' && users.length === 0 && ambientesForFilter.length === 0) {
             const fetchFilterData = async () => {
                 try {
                      const usersResponse = await api.get('/usuarios/'); // Requer Admin
                      setUsers(usersResponse.data);
                      console.log('Lista de usuários (Admin) para filtro obtida:', usersResponse.data);

                      const ambientesResponse = await api.get('/ambientes/'); // Requer Admin
                      setAmbientesForFilter(ambientesResponse.data);
                      console.log('Lista de ambientes (Admin) para filtro obtida:', ambientesResponse.data);

                 } catch (filterErr) {
                     console.error('Erro ao carregar dados para filtros:', filterErr);
                     // Pode exibir um erro específico ou apenas logar.
                 }
             };
             fetchFilterData();
       }
  }, [user?.tipo, authLoading]); // Depende do tipo de usuário e estado de auth


  // Função para lidar com a mudança nos filtros (atualiza o estado de filtros)
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
       let processedValue: any = value;
       // Tratar conversão para number ou boolean se necessário
       if (name === 'ambiente_id' && value !== '') processedValue = parseInt(value, 10); // Converter para number
       // Se status for um Select, o value já é a string do enum.
       // Se datas forem DatePicker, a mudança será diferente.


      setFilters(prevFilters => ({
          ...prevFilters,
          [name]: processedValue,
      }));
       // NOTA: Os filtros são aplicados quando o estado 'filters' muda e o useEffect principal é re-executado.
       // Se você quer um botão "Aplicar Filtros", remova 'filters' das dependências do useEffect principal
       // e chame fetchAllReservas no onClick do botão.
  };

  // Função para resetar todos os filtros
  const handleResetFilters = () => {
      setFilters({}); // Reseta para objeto vazio (sem filtros)
       // O useEffect principal detectará a mudança em 'filters' e rebuscará.
  };


  // Função para lidar com a ação de Atualizar Status de Reserva (por Admin)
  // Esta função é chamada pelos botões de status na lista.
  const handleUpdateStatus = async (reservaId: number, newStatus: ReservaData['status']) => { // Usa o tipo literal do status
       // TODO: Adicionar confirmação se necessário, especialmente para CANCELADA/FINALIZADA
        if (!window.confirm(`Tem certeza que deseja mudar o status da reserva ${reservaId} para "${newStatus.toUpperCase()}"?`)) {
            return;
        }

       setModifyingReservaId(reservaId); // Desabilita botões para esta reserva
       setError(null); // Limpa erros
       setSuccessMessage(null); // Limpa mensagens de sucesso


       try {
          // Chama o endpoint PATCH /reservas/{reserva_id}/status (requer Admin no backend)
          // Envia o novo status no corpo JSON { "novo_status": "..." }
          const response = await api.patch(`/reservas/${reservaId}/status`, { novo_status: newStatus }); // Usa 'novo_status'
          console.log(`Status da reserva ${reservaId} atualizado para "${newStatus}":`, response.data);

          // Atualiza a lista após a mudança (rebuscando é mais simples)
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

  // TODO: Implementar função para Deletar Reserva (por Admin)
  // Se você manteve o endpoint DELETE direto para admin, adicione a função handleDelete aqui.
  // Será similar a handleDelete em ManageUsersPage/ManageAmbientesPage.
  // const handleDelete = async (reservaId: number) => { /* ... */ };


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


  // Renderização condicional (estado de carregamento do Contexto OU da lista de reservas)
  if (authLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Verificando autenticação...</Typography>
        </Box>
    );
  }

  // Verificar se o usuário logado é admin (proteção frontend/UX)
  if (user?.tipo !== 'admin') {
       return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">Acesso negado. Esta página é apenas para administradores.</Typography></Box>;
  }


  // Exibir erro se houver e não estiver carregando a lista
  if (error && !loadingReservas) { // Usar loadingReservas
    return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
  }


  return (
    // **ADICIONADO:** Container principal da página (cinza claro)
    <Box sx={{ padding: 3, backgroundColor: theme.palette.background.default, minHeight: '100vh' }}> {/* Padding, fundo, altura mínima */}
      <Typography variant="h4" component="h1" gutterBottom>Gerenciar Todas as Reservas (Admin)</Typography> {/* Título */}

      {successMessage && <Typography color="green" gutterBottom>{successMessage}</Typography>}
      {error && <Typography color="error" gutterBottom>{error}</Typography>} {/* Erro relacionado à listagem */}

       {/* Filtros */}
       <Box mb={3}>
           <Typography variant="h6" gutterBottom>Filtros</Typography>
            {/* O formulário submete com enter, mas a aplicação de filtros é baseada em useEffect mudando o estado 'filters' */}
            <Box component="form" onSubmit={(e) => e.preventDefault()} display="flex" gap={2} flexWrap="wrap">

                {/* Filtro por Usuário */}
                {users.length > 0 && (
                     <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id="filter-user-label">Usuário</InputLabel>
                        <Select
                          labelId="filter-user-label"
                          id="usuario_id"
                          name="usuario_id"
                          value={filters.usuario_id || ''} // Valor do estado, '' se null/undefined
                          label="Usuário"
                          onChange={handleFilterChange}
                          disabled={loadingReservas} // Desabilitar durante o carregamento da lista
                        >
                          <MenuItem value=""><em>Todos os Usuários</em></MenuItem>
                          {users.map(userOption => (
                              <MenuItem key={userOption.id} value={userOption.id}>{userOption.nome} ({userOption.email})</MenuItem>
                          ))}
                        </Select>
                     </FormControl>
                )}

                 {/* Filtro por Ambiente */}
                 {ambientesForFilter.length > 0 && (
                    <FormControl sx={{ minWidth: 200 }}>
                       <InputLabel id="filter-ambiente-label">Ambiente</InputLabel>
                       <Select
                         labelId="filter-ambiente-label"
                         id="ambiente_id"
                         name="ambiente_id"
                         value={filters.ambiente_id || ''} // Valor do estado, '' se null/undefined
                         label="Ambiente"
                         onChange={handleFilterChange}
                         disabled={loadingReservas}
                       >
                         <MenuItem value=""><em>Todos os Ambientes</em></MenuItem>
                         {ambientesForFilter.map(ambiente => (
                             <MenuItem key={ambiente.id} value={ambiente.nome}>{ambiente.nome}</MenuItem>
                         ))}
                       </Select>
                    </FormControl>
                 )}

                  {/* Filtro por Status */}
                  <FormControl sx={{ minWidth: 150 }}>
                     <InputLabel id="filter-status-label">Status</InputLabel>
                     <Select
                       labelId="filter-status-label"
                       id="status"
                       name="status"
                       value={filters.status || ''} // Valor do estado, '' se null/undefined
                       label="Status"
                       onChange={handleFilterChange}
                       disabled={loadingReservas}
                     >
                       <MenuItem value=""><em>Todos os Status</em></MenuItem>
                       {/* Mapear os valores do Enum StatusReserva */}
                       {['pendente', 'confirmada', 'cancelada', 'finalizada'].map(statusOption => (
                          <MenuItem key={statusOption} value={statusOption}>{statusOption.toUpperCase()}</MenuItem>
                       ))}
                     </Select>
                  </FormControl>

                   {/* Filtro por Nome Usuário (Text Input) */}
                   <TextField
                      label="Nome Usuário (Filtro)"
                      id="nome_usu"
                      name="nome_usu"
                      value={filters.nome_usu || ''}
                      onChange={handleFilterChange}
                      disabled={loadingReservas}
                      sx={{ minWidth: 150 }}
                   />

                    {/* Filtro por Nome Ambiente (Text Input) */}
                    <TextField
                       label="Nome Ambiente (Filtro)"
                       id="nome_amb"
                       name="nome_amb"
                       value={filters.nome_amb || ''}
                       onChange={handleFilterChange}
                       disabled={loadingReservas}
                       sx={{ minWidth: 150 }}
                    />

                       {/* TODO: Adicionar filtros de data (DatePicker) */}
                       {/* Ex: <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Data Início ( >= )"
                                    value={filters.data_inicio_ge ? new Date(filters.data_inicio_ge) : null}
                                    onChange={(date) => handleFilterChange('data_inicio_ge', date ? formatISO(date) : null)}
                                    renderInput={(params) => <TextField {...params} />}
                                    disabled={loadingReservas}
                                />
                              </LocalizationProvider> */}
                    {/* TODO: Outros filtros de data (<= data fim, >= data fim) */}


                </Box>
                 <Box mt={2}>
                    {/* Botão Limpar Filtros */}
                     <Button variant="outlined" onClick={handleResetFilters} disabled={loadingReservas}>Limpar Filtros</Button>
                 </Box>
           </Box>


      {/* Exibir a lista de reservas */}
      {loadingReservas ? ( // Exibir spinner se a lista estiver carregando
           <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : reservas.length > 0 ? (
           <TableContainer component={Paper} elevation={2}> {/* Tabela dentro de um Paper com sombra */}
             <Table sx={{ minWidth: 650 }} aria-label="manage reservas admin table"> {/* minWidth para rolagem horizontal */}
               <TableHead>
                 <TableRow>
                   <TableCell>ID</TableCell>
                   <TableCell>Ambiente</TableCell>
                   <TableCell>Usuário</TableCell>
                   <TableCell>Período</TableCell>
                   <TableCell>Motivo</TableCell>
                   <TableCell>Status</TableCell>
                   <TableCell>Solicitada Em</TableCell>
                   <TableCell align="center">Ações</TableCell> {/* Alinhar centralizado */}
                 </TableRow>
               </TableHead>
               <TableBody>
                 {reservas.map((reserva) => (
                   <TableRow
                     key={reserva.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: theme.palette.action.hover } }} // Efeito hover
                   >
                     <TableCell component="th" scope="row">{reserva.id}</TableCell>
                     <TableCell>{reserva.ambiente.nome}</TableCell> {/* Nome do ambiente aninhado */}
                     <TableCell>{reserva.usuario.nome}</TableCell> {/* Nome do usuário aninhado */}
                     <TableCell>{formatDateTimeLocal(reserva.data_inicio)} a {formatDateTimeLocal(reserva.data_fim)}</TableCell> {/* Formatar data/hora local */}
                     <TableCell>{reserva.motivo}</TableCell>
                     <TableCell>{reserva.status.toUpperCase()}</TableCell> {/* Status */}
                      <TableCell>{formatDateTimeUtc(reserva.data_criacao)}</TableCell> {/* Formatar data/hora UTC */}
                     <TableCell align="center"> {/* Célula para botões de ação */}

                        {/* Botões de Atualizar Status (Dropdown ou Botões Específicos) */}
                        {/* Usar Select para mudar status */}
                        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }} disabled={modifyingReservaId === reserva.id || loadingReservas}> {/* Desabilitar durante modificação ou carregamento */}
                           <InputLabel id={`status-select-label-${reserva.id}`}>Status</InputLabel>
                           <Select
                             labelId={`status-select-label-${reserva.id}`}
                             id={`status-select-${reserva.id}`}
                             value={reserva.status} // Valor atual da reserva
                             label="Status"
                             onChange={(e) => handleUpdateStatus(reserva.id, e.target.value as ReservaData['status'])} // Chama handleUpdateStatus no onChange
                           >
                             {/* Mapear os valores do Enum StatusReserva */}
                             {['pendente', 'confirmada', 'cancelada', 'finalizada'].map(statusOption => (
                                // Opcional: Desabilitar transições inválidas no frontend (além do backend)
                                <MenuItem key={statusOption} value={statusOption} disabled={reserva.status === 'cancelada' && statusOption === 'confirmada'}> {/* Exemplo: Não pode ir de cancelada para confirmada */}
                                    {statusOption.toUpperCase()}
                                </MenuItem>
                             ))}
                           </Select>
                        </FormControl>


                        {' '} {/* Espaço */}

                        {/* TODO: Botão para Deletar (se mantido) */}
                         {/* Se você manteve o endpoint DELETE direto para admin, adicione o botão aqui. */}
                         {/* Ex: <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(reserva.id)} disabled={modifyingReservaId === reserva.id}>Deletar</Button> */}
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </TableContainer>
      ) : (
        <Typography variant="body1">Nenhuma reserva encontrada com os filtros atuais.</Typography>
      )}

      {/* TODO: Adicionar funcionalidade de paginação aqui */}
       <Box mt={3}> {/* Espaço acima */}
          {/* Links ou botões de paginação */}
       </Box>


       <Box mt={3}> {/* Espaço acima */}
         {/* Link para voltar (já no Layout) */}
         {/* <Link to="/home">Voltar para o início</Link> */}
       </Box>
    </Box>
  );
}

export default ManageReservasPage;