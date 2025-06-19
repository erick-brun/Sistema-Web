// frontend/src/pages/HistoryPage.tsx

import React, { useEffect, useState, useCallback } from 'react'; // Importar useCallback
import api from '../services/api';
// Importe Link ou useNavigate se precisar de navegação
import { Link, useNavigate } from 'react-router-dom';
// Importe useAuth (opcional, já que o endpoint filtra)
// import { useAuth } from '../context/AuthContext';

// Importar componentes de Material UI para listas e layout
import { Box, Typography, CircularProgress, List, ListItem, ListItemText, Paper, Button } from '@mui/material';
import theme from '../theme';

// Reutilize ou defina interfaces para os dados de histórico (já definida)
interface HistoricoReservaData {
  id: number; // ID do histórico (mesmo ID da reserva original)
  ambiente_id: number; // ID do ambiente no histórico
  usuario_id: string; // ID do usuário no histórico (UUID como string)
  data_inicio: string; // ISO 8601 string
  data_fim: string;    // ISO 8601 string
  data_criacao: string; // Data de criação da solicitação original
  status: 'pendente' | 'confirmada' | 'cancelada' | 'finalizada'; // Status final da reserva
  motivo: string;
  nome_amb: string; // Adicionado
  nome_usu: string; // Adicionado
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
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}> {/* Centralizar spinner */}
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando histórico pessoal...</Typography>
        </Box>
    );
  }

  if (error) {
    return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
  }


  return (
    // **ADICIONADO:** Container principal da página (cinza claro)
    <Box sx={{ padding: 3, backgroundColor: theme.palette.background.default }}> {/* Padding e fundo cinza */}
      <Typography variant="h4" component="h1" gutterBottom>Meu Histórico de Reservas</Typography> {/* Título */}

      {/* TODO: Adicionar filtros aqui (menos comum para histórico pessoal, mas possível) */}
      {/* Ex: Filtro por status final, data de criação/fim */}


      {/* Exibir a lista de registros de histórico */}
      {historico.length > 0 ? (
        // **MODIFICADO:** Usar componentes List, ListItem, ListItemText, Paper
        <List component={Paper} elevation={2} sx={{ padding: 2 }}> {/* Lista dentro de um Paper com sombra */}
          {historico.map(registro => (
            // Cada item da lista
            <ListItem
               key={registro.id}
               // Opcional: Tornar o item clicável para ver detalhes do histórico? (Se tiver página)
               // component={Link} to={`/historico/${registro.id}`}
               divider // Adicionar um divisor
               sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }} // Efeito hover sutil
            >
              <ListItemText // Texto principal e secundário do item
                 primary={
                    // Conteúdo principal: Ambiente e Status Final
                    <> {/* Fragmento para agrupar */}
                       {/* Exibir nome do ambiente e status final */}
                       <Typography variant="h6">
                          {registro.nome_amb} (Status Final: {registro.status.toUpperCase()})
                       </Typography>
                       {/* Exibir nome do usuário (será o próprio usuário logado) */}
                       <Typography variant="body1">
                           Solicitado por: {registro.nome_usu} {/* Nome do usuário (o próprio) */}
                       </Typography>
                    </>
                 }
                 secondary={
                    // Conteúdo secundário: Período, Motivo, Solicitada Originalmente Em
                    <> {/* Fragmento para agrupar */}
                       <Typography variant="body2" color="textSecondary">
                           Período: {formatDateTimeLocal(registro.data_inicio)} a {formatDateTimeLocal(registro.data_fim)} {/* Usar a função para horário UTC se aplicável, ou API local */}
                       </Typography>
                       <Typography variant="body2" color="textSecondary">Motivo: {registro.motivo}</Typography>
                       <Typography variant="body2" color="textSecondary">Solicitada originalmente em: {formatDateTimeUtc(registro.data_criacao)}</Typography> {/* Usar a função para horário UTC */}
                    </>
                 }
              />
               {/* Opcional: Adicionar botões para ver detalhes completos (se tiver página) */}

            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1">Você não tem registros no histórico de reservas.</Typography> // Mensagem se lista vazia
      )}

      {/* TODO: Adicionar funcionalidade de paginação aqui (menos comum para histórico pessoal, mas possível) */}


       <Box mt={3}> {/* Espaço acima */}
         {/* Link para voltar (já no Layout) */}
         {/* <Link to="/home">Voltar para o início</Link> */}
          {/* Adicionar link para voltar para Minhas Reservas */}
           <Button component={Link} to="/minhas-reservas" variant="outlined">Voltar para Minhas Reservas</Button>
       </Box>
    </Box>
  );
}

export default HistoryPage;