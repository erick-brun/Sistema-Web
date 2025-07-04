// frontend/src/pages/HistoryPageAdmin.tsx

import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
// Importe useAuth para verificar se é admin
import { useAuth } from '../context/AuthContext';
// Importe Link ou useNavigate se precisar de navegação
import { Link, useNavigate } from 'react-router-dom';
// Importe useSearchParams para filtros na URL (opcional)
import { useSearchParams } from 'react-router-dom'; // Para sincronizar filtros com a URL

// Importar componentes de Material UI para tabelas, formulários e layout
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Box, CircularProgress, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import theme from '../theme';
// Importe Date/Time Picker (se usar para filtros de data)
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// Importe para lidar com datas
import { format, formatISO, parseISO } from 'date-fns'; // Importado formatISO para datas


// Reutilize interfaces para os dados de histórico (já definida em HistoryPage)
interface HistoricoReservaData {
  id: number;
  ambiente_id: number;
  usuario_id: string; // UUID como string
  data_inicio: string; // ISO 8601 string
  data_fim: string;    // ISO 8601 string
  data_criacao: string; // Data de criação da solicitação original
  status: 'pendente' | 'confirmada' | 'cancelada' | 'finalizada';
  motivo: string;
  nome_amb: string; // Adicionado
  nome_usu: string; // Adicionado
}

interface UsuarioData {
  id: string; // UUID como string
  nome: string;
  email: string;
}

interface AmbienteData {
  id: number;
  nome: string;
}

// Interface para os valores dos filtros
interface HistoricoFilters {
    usuario_id?: string; // string para o UUID
    ambiente_id?: number | ''; // number ou '' para select vazio
    status?: HistoricoReservaData['status'] | ''; // string do Enum ou ''
    nome_amb?: string;
    nome_usu?: string;
    data_inicio_ge?: string; // ISO 8601 string
    data_inicio_le?: string;
    data_fim_ge?: string;
    data_fim_le?: string;
}


function HistoryPageAdmin() { // Renomeado para Administradores
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams(); // Para sincronizar filtros com a URL


  // State para armazenar a lista de registros de histórico
  const [historico, setHistorico] = useState<HistoricoReservaData[]>([]);

  // **NOVO ESTADO:** Para armazenar a lista de usuários para popular filtro de usuário
  const [users, setUsers] = useState<UsuarioData[]>([]);
  // **NOVO ESTADO:** Para armazenar a lista de ambientes para popular filtro de ambiente
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);


  // **NOVO ESTADO:** Para armazenar os valores dos filtros (já definida)
  // Inicializa a partir dos search params da URL ou valores padrão
  const [filters, setFilters] = useState<HistoricoFilters>(() => {
     const initialFilters: HistoricoFilters = {};
     const statusParam = searchParams.get('status');
     if (statusParam && ['pendente', 'confirmada', 'cancelada', 'finalizada'].includes(statusParam)) {
          initialFilters.status = statusParam as HistoricoReservaData['status'];
     }
     const userIdParam = searchParams.get('usuario_id');
     if(userIdParam) initialFilters.usuario_id = userIdParam;
     const ambienteIdParam = searchParams.get('ambiente_id');
     if(ambienteIdParam) initialFilters.ambiente_id = parseInt(ambienteIdParam, 10) || '';
     const nomeAmbParam = searchParams.get('nome_amb');
     if(nomeAmbParam) initialFilters.nome_amb = nomeAmbParam;
     const nomeUsuParam = searchParams.get('nome_usu');
     if(nomeUsuParam) initialFilters.nome_usu = nomeUsuParam;
     const dataInicioGeParam = searchParams.get('data_inicio_ge');
     if(dataInicioGeParam) initialFilters.data_inicio_ge = dataInicioGeParam;
     const dataInicioLeParam = searchParams.get('data_inicio_le');
     if(dataInicioLeParam) initialFilters.data_inicio_le = dataInicioLeParam;
     const dataFimGeParam = searchParams.get('data_fim_ge');
     if(dataFimGeParam) initialFilters.data_fim_ge = dataFimGeParam;
     const dataFimLeParam = searchParams.get('data_fim_le');
     if(dataFimLeParam) initialFilters.data_fim_le = dataFimLeParam;


     return initialFilters;
  });


  // State para lidar com estado de carregamento da lista
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros
  const [error, setError] = useState<string | null>(null);

  // TODO: State para paginação (skip, limit)
  // const [pagination, setPagination] = useState({ skip: 0, limit: 100 });


  // **NOVA LÓGICA:** Função para buscar a lista de histórico (definida FORA do useEffect)
  // Usamos useCallback para memorizar a função se ela tiver muitas dependências e for passada como prop.
  // Não é estritamente necessário aqui, mas é boa prática.
  const fetchHistoryData = useCallback(async () => {
     // Verifica se o usuário logado é admin antes de tentar buscar a lista
    if (user?.tipo !== 'admin') {
        setError("Acesso negado. Esta página é apenas para administradores.");
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      setError(null);

      // Chamar o endpoint GET /reservas/historico com FILTROS e paginação
      const response = await api.get('/reservas/historico', {
         params: {
           ...filters, // Passa todos os filtros do estado
           // TODO: Adicionar skip e limit do estado de paginação
           // skip: pagination.skip,
           // limit: pagination.limit,
           // Tratamento especial para status/ambiente_id se forem '' (o backend espera undefined)
           status: filters.status === '' ? undefined : filters.status,
           ambiente_id: filters.ambiente_id === '' ? undefined : filters.ambiente_id,
           // TODO: Formatar datas de objetos Date (se usar date pickers) para string ISO 8601 se necessário
         }
      });

      setHistorico(response.data);
      console.log('Lista geral de histórico de reservas (Admin) obtida:', response.data);

    } catch (err: any) {
      console.error('Erro ao obter histórico geral de reservas:', err);
      const errorMessage = err.response?.data?.detail || 'Erro ao carregar histórico de reservas.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.tipo, filters, api]); // **DEPENDÊNCIAS:** A função depende do tipo do usuário e dos filtros. api raramente muda.


  // useEffect principal: Carregar a lista de histórico (chamando fetchHistoryData)
  useEffect(() => {
    // Roda a busca quando o componente é montado OU quando filtros/tipo de usuário mudam
    // Importante: Roda APENAS se o estado de autenticação não estiver carregando E o usuário for admin
    if (!authLoading && user?.tipo === 'admin') {
        fetchHistoryData(); // <--- CHAMA A FUNÇÃO DEFINIDA FORA DO useEffect
    } else if (!authLoading && user?.tipo !== 'admin') {
         // Se terminou de carregar e não é admin, define loading como false para exibir mensagem de acesso negado
         setLoading(false);
    }

    // TODO: Sincronizar filtros do estado com os search params da URL quando eles mudam (no useEffect)
    // const params = new URLSearchParams();
    // Object.entries(filters).forEach(([key, value]) => {
    //     if (value !== undefined && value !== null && value !== '') { // Ignorar valores vazios
    //          params.set(key, String(value));
    //     } else {
    //         params.delete(key);
    //     }
    // });
    // setSearchParams(params);

  }, [user?.tipo, authLoading, filters, fetchHistoryData, setSearchParams]); // **DEPENDÊNCIAS:** tipo do usuário, estado de auth, filtros, fetchHistoryData (pois é chamada dentro), setSearchParams (se usar)


  // useEffect para carregar dados para popular os filtros (lista de usuários e ambientes)
  // Este useEffect deve rodar APENAS UMA VEZ na montagem (ou quando o usuário ADMIN loga).
  useEffect(() => {
       // Carregar dados para filtros APENAS se o usuário for admin e os dados ainda não foram carregados
       if (!authLoading && user?.tipo === 'admin' && users.length === 0 && ambientes.length === 0) { // Garante que só carrega uma vez para admin
             const fetchFilterData = async () => {
                 try {
                      // Não define loading aqui, pois é loading da lista principal.
                      // Poderia ter um estado de loading separado para filtros se necessário.
                      const usersResponse = await api.get('/usuarios/'); // Requer Admin
                      setUsers(usersResponse.data);
                      console.log('Lista de usuários (Admin) para filtro obtida:', usersResponse.data);

                      const ambientesResponse = await api.get('/ambientes/'); // Requer Admin
                      setAmbientes(ambientesResponse.data);
                      console.log('Lista de ambientes (Admin) para filtro obtida:', ambientesResponse.data);

                 } catch (filterErr) {
                     console.error('Erro ao carregar dados para filtros:', filterErr);
                     // Opcional: exibir um erro específico ou logar.
                 }
             };
             fetchFilterData();
       }
  }, [user?.tipo, authLoading]); // Depende do tipo de usuário e estado de auth


  // Função para lidar com a mudança nos filtros (atualiza o estado de filtros)
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
       let processedValue: any = value;
       if (name === 'ambiente_id' && value !== '') processedValue = parseInt(value, 10);
       // Se status for um Select, o value já é a string do enum.

      setFilters(prevFilters => ({
          ...prevFilters,
          [name]: processedValue,
      }));
       // NOTA: Os filtros são aplicados quando o estado 'filters' muda e o useEffect principal é re-executado.
       // Se você quer um botão "Aplicar Filtros", remova 'filters' das dependências do useEffect principal
       // e chame fetchHistoryData no onClick do botão.
  };

  // Função para resetar todos os filtros
  const handleResetFilters = () => {
      setFilters({}); // Reseta para objeto vazio (sem filtros)
      // O useEffect principal detectará a mudança em 'filters' e rebuscará.
      // TODO: Limpar search params da URL também (se estiver usando sincronização)
      setSearchParams({});
  };


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


  // Renderização condicional (estado de carregamento inicial do AuthContext)
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
  if (error && !loading) {
    return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
  }


  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>Histórico Geral de Reservas (Admin)</Typography>

       {/* TODO: Adicionar filtros (dropdowns, date pickers) aqui */}
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
                          disabled={loading} // Desabilitar durante o carregamento da lista
                        >
                          <MenuItem value=""><em>Todos os Usuários</em></MenuItem>
                          {users.map(userOption => (
                              <MenuItem key={userOption.id} value={userOption.id}>{userOption.nome} ({userOption.email})</MenuItem>
                          ))}
                        </Select>
                     </FormControl>
                )}

                 {/* Filtro por Ambiente */}
                 {ambientes.length > 0 && (
                    <FormControl sx={{ minWidth: 200 }}>
                       <InputLabel id="filter-ambiente-label">Ambiente</InputLabel>
                       <Select
                         labelId="filter-ambiente-label"
                         id="ambiente_id"
                         name="ambiente_id"
                         value={filters.ambiente_id || ''} // Valor do estado, '' se null/undefined
                         label="Ambiente"
                         onChange={handleFilterChange}
                         disabled={loading}
                       >
                         <MenuItem value=""><em>Todos os Ambientes</em></MenuItem>
                         {ambientes.map(ambiente => (
                             <MenuItem key={ambiente.id} value={ambiente.id}>{ambiente.nome}</MenuItem>
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
                       disabled={loading}
                     >
                       <MenuItem value=""><em>Todos os Status</em></MenuItem>
                       {/* Mapear os valores do Enum StatusReserva */}
                       {/* Hardcoded por enquanto, pode buscar da API se houver endpoint */}
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
                      disabled={loading}
                      sx={{ minWidth: 150 }}
                   />

                    {/* Filtro por Nome Ambiente (Text Input) */}
                    <TextField
                       label="Nome Ambiente (Filtro)"
                       id="nome_amb"
                       name="nome_amb"
                       value={filters.nome_amb || ''}
                       onChange={handleFilterChange}
                       disabled={loading}
                       sx={{ minWidth: 150 }}
                    />

                       {/* TODO: Adicionar filtros de data (DatePicker) */}
                       {/* Ex: <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Data Início ( >= )"
                                    value={filters.data_inicio_ge ? new Date(filters.data_inicio_ge) : null}
                                    onChange={(date) => handleFilterChange('data_inicio_ge', date ? formatISO(date) : null)}
                                    renderInput={(params) => <TextField {...params} />}
                                    disabled={loading}
                                />
                              </LocalizationProvider> */}
                    {/* TODO: Outros filtros de data (<= data fim, >= data fim) */}


                </Box>
                 <Box mt={2}> {/* Box para o botão de reset */}
                    {/* Botão Limpar Filtros */}
                     <Button variant="outlined" onClick={handleResetFilters} disabled={loading}>Limpar Filtros</Button>
                 </Box>
           </Box>


      {/* Exibir a lista de registros de histórico */}
      {loading ? ( // Exibir spinner se a lista estiver carregando
           <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : historico.length > 0 ? (
           <TableContainer component={Paper} elevation={2}> {/* Tabela dentro de um Paper com sombra */}
             <Table sx={{ minWidth: 650 }} aria-label="historico reservas admin table"> {/* minWidth para rolagem horizontal */}
               <TableHead> {/* Cabeçalho */}
                 <TableRow>
                   <TableCell>ID Original</TableCell>
                   <TableCell>Ambiente</TableCell>
                   <TableCell>Usuário</TableCell>
                   <TableCell>Período</TableCell>
                   <TableCell>Motivo</TableCell>
                   <TableCell>Status Final</TableCell>
                   <TableCell>Solicitada Originalmente Em</TableCell>
                 </TableRow>
               </TableHead>
               <TableBody> {/* Corpo da tabela */}
                 {historico.map(registro => (
                   <TableRow
                     key={registro.id}
                      // Adicionar efeito hover (opcional)
                      sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: theme.palette.action.hover } }} // Remover borda na última linha, efeito hover
                   >
                     <TableCell component="th" scope="row">{registro.id}</TableCell>
                     <TableCell>{registro.nome_amb}</TableCell>
                     <TableCell>{registro.nome_usu}</TableCell>
                     <TableCell>{formatDateTimeLocal(registro.data_inicio)} a {formatDateTimeLocal(registro.data_fim)}</TableCell> {/* Usar formatDateTime */}
                     <TableCell>{registro.motivo}</TableCell>
                     <TableCell>{registro.status.toUpperCase()}</TableCell>
                     <TableCell>{formatDateTimeUtc(registro.data_criacao)}</TableCell> {/* Usar formatDateTime */}
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </TableContainer>
      ) : (
        <Typography variant="body1">Nenhum registro no histórico encontrado com os filtros atuais.</Typography>
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

export default HistoryPageAdmin;