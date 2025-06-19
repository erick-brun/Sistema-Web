// frontend/src/pages/Home.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // Para obter o usuário logado

import theme from '../theme';

// Importe Date/Time Picker (se usar para filtros de data)
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// Importe para lidar com datas
import { format, formatISO, parseISO } from 'date-fns'; // Para formatar/parsear datas

// Importe Material UI
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

// **IMPORTAR:** Componente DashboardPanel
import DashboardPanel from '../components/DashboardPanel'; // <--- IMPORTADO: Componente do Painel

// Reutilize interfaces (já definidas)
interface UsuarioData { id: string; nome: string; email: string; tipo: 'user' | 'admin'; ativo: boolean; data_criacao: string; /* ... */ }

// Reutilize a interface para os dados de reserva do dashboard
interface ReservaDashboardData { // Baseado no schema ReservaDashboard do backend
  ambiente_nome: string;
  data_inicio: string; // ISO 8601 string (datetime)
  data_fim: string;    // ISO 8601 string (datetime)
  usuario_nome: string;
  motivo: string; // Se incluído no schema ReservaDashboard
  // Opcional: id, status
}

// TODO: Definir opções para Turnos (deve corresponder ao backend)
const turnoOptions = ['manha', 'tarde', 'noite'];


function HomePage() {
  const navigate = useNavigate();
  // Obtenha o usuário logado do contexto
  const { user, logout, loading: authLoading } = useAuth();

  // **NOVO ESTADO:** State para a lista de reservas do dashboard
  const [reservasDashboard, setReservasDashboard] = useState<ReservaDashboardData[]>([]);

  // **NOVO ESTADO:** State para os filtros do dashboard (data e turno)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd')); // Começa com a data atual formatada
  const [selectedTurno, setSelectedTurno] = useState<string>('manha'); // Começa com o turno padrão

  // **NOVO ESTADO:** State para lidar com estado de carregamento do DASHBOARD
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true); // Estado de carregamento apenas para a lista do dashboard
  // **NOVO ESTADO:** State para lidar com erros do DASHBOARD
  const [dashboardError, setDashboardError] = useState<string | null>(null);


  // **NOVA LÓGICA:** Função para buscar os dados do dashboard
  const fetchDashboardReservas = useCallback(async () => {
       // Verificar se a data e o turno estão selecionados
       if (!selectedDate || !selectedTurno) {
           setReservasDashboard([]);
           setLoadingDashboard(false);
           return;
       }

       try {
         setLoadingDashboard(true); // Inicia o carregamento do dashboard
         setDashboardError(null); // Limpa erros do dashboard

         // Formatar a data para YYYY-MM-DD (backend espera este formato)
         const formattedDate = selectedDate; // Já está no formato correto

         // Chamar o endpoint público GET /reservas/dashboard/dia-turno
         const response = await api.get('/reservas/dashboard/dia-turno', {
           params: {
             data_alvo: formattedDate,
             turno_alvo: selectedTurno,
           }
         });

         setReservasDashboard(response.data);
         console.log('Reservas para dashboard obtidas:', response.data);

       } catch (err: any) {
         console.error('Erro ao obter reservas para dashboard:', err);
         const errorMessage = err.response?.data?.detail || 'Erro ao carregar reservas para o dashboard.';
         setDashboardError(errorMessage); // Define erro do dashboard
       } finally {
         setLoadingDashboard(false); // Finaliza o carregamento do dashboard
       }
   }, [selectedDate, selectedTurno, api]); // Dependências: data e turno selecionados, api


  // **NOVO useEffect:** Chamar fetchDashboardReservas quando os filtros mudam ou a página Home é carregada
  useEffect(() => {
       // Não precisa checar user/authLoading aqui, pois a rota Home é protegida
       // e este effect só rodará quando o componente Home for montado (e user estará disponível)
       fetchDashboardReservas(); // Chama a função de busca

       // Adiciona user?.tipo como dependência se quiser que o dashboard recarregue
       // caso o tipo de usuário mude (menos comum)
   }, [selectedDate, selectedTurno, fetchDashboardReservas]);


  // Função para lidar com a mudança na seleção de data
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setSelectedDate(e.target.value); // Armazena a string YYYY-MM-DD diretamente
   };

  // Função para lidar com a mudança na seleção de turno (existente)
  const handleTurnoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
       setSelectedTurno(e.target.value); // Armazena a string do turno
   };


    // Função auxiliar para formatar apenas a data (exibição)
    const formatDate = (dateString: string) => {
        try {
             const date = parseISO(dateString); // Parse a string YYYY-MM-DD
              return format(date, 'dd/MM/yyyy'); // Formato dd/MM/yyyy
        } catch (e) {
             console.error("Erro ao formatar data:", dateString, e);
             return "Data inválida";
        }
    };


  // Renderização condicional (agora apenas loadingDashboard ou dashboardError)
  // O loading inicial do AuthContext é tratado no Layout/ProtectedRoute.
  // O user e logout são obtidos do contexto e sempre disponíveis aqui se a rota foi acessada.

  // Não é necessário verificar loading ou error do usuário logado, pois AuthContext já lida.


  return (
    <Box sx={{ padding: 3 }}>
      {/* ... Título principal e dados do usuário logado ... */}

      {/* Seção do Dashboard (incluindo filtros e o painel) */}
      {/* **MODIFICADO:** Cor de fundo BRANCO para a seção dashboard (que envolve filtros e painel) */}
      <Box sx={{
          mb: 4,
          padding: 3, // Padding interno da seção dashboard
          backgroundColor: theme.palette.background.paper, // <--- USAR a cor branca do tema
          borderRadius: 2,
          // Sombra se desejar
          boxShadow: 'var(--shadow-base)', // Adicionar sombra aqui
      }}>
          <Typography variant="h5" gutterBottom>Reservas do Dia por Turno (Público)</Typography>

          {/* Filtros de Data e Turno para o Dashboard */}
          <Box mb={3} display="flex" gap={2} alignItems="center">
              <Typography variant="body1">Visualizando para:</Typography>

               {/* **CORRIGIDO:** Apenas UM Seletor de Data (Input type="date") */}
               <TextField
                   label="Data"
                   type="date"
                   // value formatada para YYYY-MM-DD, necessário para input type="date"
                   value={selectedDate} // Usa o estado selectedDate
                   onChange={handleDateChange} // Chama a função de mudança de data
                    InputLabelProps={{ shrink: true }}
                    disabled={loadingDashboard} // Desabilitar enquanto carrega
                 />

               {/* Seletor de Turno (Select) */}
                <FormControl sx={{ minWidth: 150 }} disabled={loadingDashboard}>
                   <InputLabel id="turno-select-label">Turno</InputLabel>
                   <Select
                     labelId="turno-select-label"
                     id="selectedTurno"
                     name="selectedTurno"
                     value={selectedTurno} // Usa o estado selectedTurno
                     label="Turno"
                     onChange={handleTurnoChange} // Usa a função de mudança de turno
                     disabled={loadingDashboard}
                   >
                     {/* Opções de turno */}
                     {turnoOptions.map(turno => (
                         <MenuItem key={turno} value={turno}>{turno.charAt(0).toUpperCase() + turno.slice(1)}</MenuItem>
                     ))}
                   </Select>
                </FormControl>

                {/* TODO: Adicionar outros filtros aqui, se necessário */}

           </Box>

          {/* Componente DashboardPanel */}
          <DashboardPanel
               reservas={reservasDashboard}
               loading={loadingDashboard}
               error={dashboardError}
               selectedDate={selectedDate}
               selectedTurno={selectedTurno}
          />

      </Box>

      {/* ... Outros links e conteúdo ... */}
    </Box>
  );
}

export default HomePage;