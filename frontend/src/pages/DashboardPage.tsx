// frontend/src/pages/DashboardPage.tsx

import React, { useEffect, useState, useCallback } from 'react'; // Adicionado useCallback
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
// Importe useSearchParams (se necessário)
// import { useSearchParams } from 'react-router-dom';

// Importe Material UI
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Box, CircularProgress } from '@mui/material';
// Importe Date Picker (se usar para filtros de data)
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// Importe para lidar com datas
import { format, formatISO, parseISO } from 'date-fns'; // Importado formatISO para datas


// Reutilize a interface para os dados de reserva do dashboard
interface ReservaDashboardData {
  ambiente_nome: string;
  data_inicio: string; // ISO 8601 string (datetime)
  data_fim: string;    // ISO 8601 string (datetime)
  usuario_nome: string;
  motivo: string; // Adicionado se o backend retornar
  // Opcional: id, status
}

// TODO: Definir opções para Turnos (deve corresponder ao backend)
const turnoOptions = ['manha', 'tarde', 'noite']; // Manter como array de strings

function DashboardPage() {
  // const navigate = useNavigate(); // Não usado
  // const [searchParams, setSearchParams] = useSearchParams(); // Não usado por enquanto


  // State para a lista de reservas do dashboard
  const [reservasDashboard, setReservasDashboard] = useState<ReservaDashboardData[]>([]);

  // State para os filtros (data e turno)
  // **CORRIGIDO:** selectedDate armazena string YYYY-MM-DD para evitar problemas de fuso horário inicial
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd')); // Começa com a data atual formatada
  const [selectedTurno, setSelectedTurno] = useState<string>('manha');


  // State para lidar com estado de carregamento
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros
  const [error, setError] = useState<string | null>(null);


  // **NOVA LÓGICA:** Função para buscar os dados do dashboard
  const fetchDashboardReservas = useCallback(async () => {
      // Verificar se a data e o turno estão selecionados (agora checando strings)
      if (!selectedDate || !selectedTurno) {
          setReservasDashboard([]); // Limpa lista
          setLoading(false);
          return;
      }

      try {
        setLoading(true);
        setError(null);

        // Formatar a data para YYYY-MM-DD (backend espera este formato)
        // A data já está em YYYY-MM-DD no estado selectedDate
        const formattedDate = selectedDate; // Já está no formato correto

        // Chamar o endpoint público GET /reservas/dashboard/dia-turno
        const response = await api.get('/reservas/dashboard/dia-turno', {
          params: {
            data_alvo: formattedDate, // Passa a data formatada
            turno_alvo: selectedTurno, // Passa o turno
          }
        });

        setReservasDashboard(response.data);
        console.log('Reservas para dashboard obtidas:', response.data);

      } catch (err: any) {
        console.error('Erro ao obter reservas para dashboard:', err);
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar reservas para o dashboard.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
  }, [selectedDate, selectedTurno, api]); // Dependências: data e turno selecionados, api


  // useEffect principal: Chamar fetchDashboardReservas quando os filtros mudam
  useEffect(() => {
      fetchDashboardReservas(); // Chama a função de busca
  }, [selectedDate, selectedTurno, fetchDashboardReservas]); // Dependências: data, turno, e a própria função de busca


  // Função para lidar com a mudança na seleção de data
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // **CORRIGIDO:** Armazena a string YYYY-MM-DD diretamente
      setSelectedDate(e.target.value);
       // NOTA: A busca acontecerá automaticamente quando selectedDate mudar (graças ao useEffect).
  };

  // Função para lidar com a mudança na seleção de turno (existente)
  const handleTurnoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedTurno(e.target.value);
       // NOTA: A busca acontecerá automaticamente quando selectedTurno mudar.
  };


  // Função auxiliar para formatar apenas o horário (exibição)
  const formatTime = (dateTimeString: string) => {
       // A string vem no formato ISO 8601 com datetime.
       // Use date-fns parseISO para lidar com o timezone (se presente) ou assumir UTC (Z)
       try {
            // **CORRIGIDO:** Usar parseISO para parsear a string ISO 8601
            const date = parseISO(dateTimeString);
             return format(date, 'HH:mm'); // Formato HH:mm
       } catch (e) {
            console.error("Erro ao formatar data/hora:", dateTimeString, e);
            return "Hora inválida";
       }
  };


  // Renderização condicional
  if (loading) { /* ... spinner ... */ return null; /* Retorna null para não renderizar o resto enquanto carrega */ } // Pode retornar null ou o spinner
  // Se não estiver carregando e não houver erro, renderiza o conteúdo principal.

  // Erro ao carregar reservas
  if (error) {
    return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
  }


  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>Reservas do Dia</Typography>

       {/* Filtros de Data e Turno */}
       <Box mb={3}> {/* Removido display="flex" gap={2} flexWrap="wrap" para simplificar o form container */}
           <Typography variant="h6" gutterBottom>Reservas para:</Typography>

            {/* **ADICIONADO:** Formulário para os filtros */}
            <Box component="form" onSubmit={(e) => e.preventDefault()} display="flex" gap={2} alignItems="center"> {/* Formulário sem submissão real */}

                {/* Seletor de Data (Input type="date") */}
                 <TextField
                     label="Data"
                     type="date"
                     // value é a string YYYY-MM-DD do estado
                     value={selectedDate} // **CORRIGIDO:** Usa a string YYYY-MM-DD do estado
                     onChange={handleDateChange} // Usa a função de mudança de data
                      InputLabelProps={{ shrink: true }}
                      disabled={loading} // Desabilitar enquanto carrega
                   />


                {/* Seletor de Turno (Select) */}
                 <FormControl sx={{ minWidth: 150 }} disabled={loading}>
                    <InputLabel id="turno-select-label">Turno</InputLabel>
                    <Select
                      labelId="turno-select-label"
                      id="selectedTurno"
                      name="selectedTurno"
                      value={selectedTurno}
                      label="Turno"
                      onChange={handleTurnoChange} // Usa a função de mudança de turno
                    >
                      {turnoOptions.map(turno => (
                          <MenuItem key={turno} value={turno}>{turno.charAt(0).toUpperCase() + turno.slice(1)}</MenuItem>
                      ))}
                    </Select>
                 </FormControl>

                 {/* Nota: Não precisa de um botão "Aplicar Filtros" se o useEffect reage às mudanças nos estados de filtro. */}

            </Box> {/* Fim do formulário */}
       </Box>


      {/* Exibir a lista de reservas para o dia e turno selecionados (como antes) */}
      {loading ? ( // Exibir spinner se a lista estiver carregando
           <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : reservasDashboard.length > 0 ? ( // Se não estiver carregando E tiver reservas
           <table>
              <thead> {/* ... */} </thead>
              <tbody>
                 {reservasDashboard.map((reserva, index) => ( // Usar index como key provisoriamente
                    <tr key={index}>
                       <td>{reserva.ambiente_nome}</td>
                       <td>{formatTime(reserva.data_inicio)} - {formatTime(reserva.data_fim)}</td>
                       <td>{reserva.usuario_nome}</td>
                       {/*<td>{reserva.motivo}</td>*/}
                    </tr>
                 ))}
              </tbody>
           </table>

      ) : ( // Se não estiver carregando E NÃO tiver reservas
           <Typography variant="body1">Nenhuma reserva encontrada para o dia {selectedDate ? format(parseISO(selectedDate), 'dd/MM/yyyy') : ''} no turno "{selectedTurno}".</Typography>
      )}


      {/* Opcional: Link para home */}
       <Box mt={3}>
         <Link to="/home">Voltar para Home</Link>
       </Box>

    </Box>
  );
}

export default DashboardPage;