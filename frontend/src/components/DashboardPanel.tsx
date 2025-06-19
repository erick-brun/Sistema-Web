// frontend/src/components/DashboardPanel.tsx

import React, { useState, useRef } from 'react';
// Importe Material UI para layout e estilo
import { Box, Typography, Paper, Button, CircularProgress, useTheme } from '@mui/material';
// Importe o ícone de tela cheia (opcional)
// import FullscreenIcon from '@mui/icons-material/Fullscreen';
// Importe ícone de sair da tela cheia (opcional)
// import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// Reutilize a interface para os dados de reserva do dashboard
interface ReservaDashboardData {
  ambiente_nome: string;
  // **ADICIONADO:** Incluir tipo_ambiente para agrupar
  tipo_ambiente: string; // <--- ADICIONADO (Assumindo string do Enum)
  data_inicio: string; // ISO 8601 string
  data_fim: string;    // ISO 8601 string
  usuario_nome: string;
  motivo: string; // Se incluído
  // Opcional: id, status
}

// Interface para as props do componente DashboardPanel (existente)
interface DashboardPanelProps {
  reservas: ReservaDashboardData[]; // Lista de reservas a exibir
  loading?: boolean;
  error?: string | null;
  selectedDate?: string;
  selectedTurno?: string;
}


// Função auxiliar para formatar apenas o horário (reutilizada)
const formatTime = (dateTimeString: string) => {
    try {
         const date = new Date(dateTimeString);
         return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Formato HH:MM local
    } catch (e) {
         console.error("Erro ao formatar data/hora:", dateTimeString, e);
         return "Hora inválida";
    }
};

// Função auxiliar para formatar apenas a data (exibição)
const formatDate = (dateString: string) => {
    // Checar se a string é válida (YYYY-MM-DD) antes de formatar
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return "Data inválida";
    }
    try {
         // Dividir a string e reordenar
         const [year, month, day] = dateString.split('-');
          return `${day}/${month}/${year}`; // Formato dd/MM/yyyy
    } catch (e) {
         console.error("Erro ao formatar data string:", dateString, e);
         return "Data inválida";
    }
    // Alternativa usando date-fns (pode ter problemas de fuso horário dependendo da implementação do new Date interno)
    // try {
    //      const date = new Date(dateString + 'T00:00:00'); // Tentar forçar interpretação local/neutra
    //      return format(date, 'dd/MM/yyyy');
    // } catch(e) { ... }

};

// Função auxiliar para formatar o nome do tipo de ambiente (capitalizar primeira letra)
const formatTipoAmbiente = (tipo: string) => {
    if (!tipo) return '';
    // Substitui underscores por espaços e capitaliza a primeira letra de cada palavra
    return tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


// Componente de Painel Visual do Dashboard
const DashboardPanel: React.FC<DashboardPanelProps> = ({ reservas, loading, error, selectedDate, selectedTurno }) => {

  const panelRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const theme = useTheme();

  // Lógica para entrar em tela cheia
  const handleFullScreen = () => {
      if (panelRef.current) {
          if (panelRef.current.requestFullscreen) {
              panelRef.current.requestFullscreen();
              setIsFullScreen(true);
          }
           // TODO: Adicionar suporte para outros navegadores (webkit, moz, ms)
      }
  };

  // Lógica para sair de tela cheia
  const handleExitFullScreen = () => {
       if (document.exitFullscreen) {
           document.exitFullscreen();
           setIsFullScreen(false);
       }
        // TODO: Adicionar suporte para outros navegadores
   };

  // Lidar com eventos de mudança de tela cheia (ex: pressionar ESC)
   React.useEffect(() => {
      const handleFullScreenChange = () => {
          // Verifica se algum elemento está em tela cheia. Se não, atualiza o estado.
          // Usa || para suportar webkit, moz, ms
           setIsFullScreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement));
      };

      // Adiciona listeners para os eventos de tela cheia
       document.addEventListener('fullscreenchange', handleFullScreenChange);
       (document as any).addEventListener('webkitfullscreenchange', handleFullScreenChange);
       (document as any).addEventListener('mozfullscreenchange', handleFullScreenChange);
       (document as any).addEventListener('MSFullscreenChange', handleFullScreenChange);


      // Função de limpeza para remover os listeners
       return () => {
           document.removeEventListener('fullscreenchange', handleFullScreenChange);
           (document as any).removeEventListener('webkitfullscreenchange', handleFullScreenChange);
           (document as any).removeEventListener('mozfullscreenchange', handleFullScreenChange);
           (document as any).removeEventListener('MSFullscreenChange', handleFullScreenChange);
       };
   }, []); // Rodar apenas uma vez na montagem


  // Renderização condicional (opcional, dependendo de como a página pai lida com loading/error)
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Typography variant="body1" color="error">Erro ao carregar painel: {error}</Typography>;
  }
  if (!reservas || reservas.length === 0) {
       return (
           <Typography variant="body1">Nenhuma reserva encontrada para o dia {selectedDate ? formatDate(selectedDate) : ''} no turno "{selectedTurno}".</Typography>
       );
  }


  // **MODIFICADO:** Agrupar reservas por TIPO de ambiente.
  // Assumindo que tipo_ambiente AGORA está na ReservaDashboardData.
  const reservasByTipoAmbiente = reservas.reduce((acc, reserva) => {
      // Use o tipo_ambiente da reserva. Fallback 'Outros' se for nulo ou vazio.
      const tipo = reserva.tipo_ambiente || 'Outros';
      if (!acc[tipo]) {
          acc[tipo] = [];
      }
      acc[tipo].push(reserva);
      return acc;
  }, {} as {[tipoAmbiente: string]: ReservaDashboardData[]});


  return (
    // Container principal do painel (será referenciado para tela cheia)
    // **MODIFICADO:** Adicionar fundo cinza (usando a cor do tema)
    <Box
        ref={panelRef}
        sx={{
            padding: 2,
            border: '1px solid #ccc', // Borda sutil
            borderRadius: 2,
            // **MODIFICADO:** Usar a cor customizada para o fundo do painel (cinza claro)
            backgroundColor: theme.palette.background.default, // <--- USAR a cor cinza claro do tema
            // Adicionar estilos para MODO TELA CHEIA (bordas, padding, etc. quando estiver em tela cheia)
            // Aplicar estilos específicos quando isFullScreen for true
            ...(isFullScreen && { // Exemplo: Aplicar estilos adicionais quando isFullScreen é true
                 position: 'fixed', // Fixar na tela
                 top: 0, left: 0, right: 0, bottom: 0, // Ocupar toda a tela
                 zIndex: 9999, // Garantir que fica por cima de tudo
                 overflowY: 'auto', // Adicionar scroll se o conteúdo for maior que a tela
                 borderRadius: 0, // Remover cantos arredondados em tela cheia
                 // Pode precisar ajustar padding, borda, etc. em tela cheia.
            })
        }}
    >

      {/* Título do Painel (Dia e Turno) - Usando a função formatDate corrigida */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
              {/* **CORRIGIDO:** Usar formatDate na string selectedDate */}
              Reservas para {selectedDate ? formatDate(selectedDate) : ''} - {selectedTurno ? selectedTurno.charAt(0).toUpperCase() + selectedTurno.slice(1) : ''}
          </Typography>
           {/* Botão Tela Cheia */}
            {isFullScreen ? (
                 <Button variant="outlined" size="small" onClick={handleExitFullScreen}>Sair Tela Cheia</Button>
            ) : (
                 <Button variant="outlined" size="small" onClick={handleFullScreen}>Tela Cheia</Button>
            )}

      </Box>

      {/* Conteúdo do Painel: Reservas Agrupadas por TIPO de Ambiente */}
      {/* **MODIFICADO:** Iterar sobre os grupos por tipo de ambiente */}
      {Object.entries(reservasByTipoAmbiente).map(([tipoAmbiente, reservaList]) => (
          // **MODIFICADO:** Container para cada grupo por tipo de ambiente
          <Box key={tipoAmbiente} mb={3}>
              {/* **MODIFICADO:** Título do Grupo (Nome do Tipo de Ambiente) */}
              <Typography variant="h6" component="h3" gutterBottom>{formatTipoAmbiente(tipoAmbiente)}</Typography> {/* Exibir o nome do Tipo de Ambiente formatado */}
              {/* **MODIFICADO:** Lista de reservas para este grupo, exibidas como caixinhas lado a lado */}
              {/* Usar display="flex" e flexWrap="wrap" para layout lado a lado */}
              {/* Adicionar 'alignItems="flex-start"' para garantir que caixinhas de diferentes alturas alinham no topo */}
              <Box display="flex" flexWrap="wrap" gap={2} alignItems="flex-start">
                  {/* Iterar sobre as reservas dentro deste grupo */}
                  {reservaList.map((reserva, index) => (
                      // **MODIFICADO:** Caixa individual de reserva (Paper)
                      <Paper key={index} elevation={2} sx={{ padding: 1.5, minWidth: 180, maxWidth: 250, flexGrow: 1 }}>
                          {/* **MODIFICADO:** Conteúdo da Caixinha */}
                           {/* Nome do Ambiente */}
                          <Typography variant="body1" fontWeight="bold" gutterBottom>{reserva.ambiente_nome}</Typography> {/* Adicionado gutterBottom para espaço abaixo */}
                           {/* Horário */}
                          <Typography variant="body2">{formatTime(reserva.data_inicio)} - {formatTime(reserva.data_fim)}</Typography>
                           {/* Nome do Responsável */}
                          <Typography variant="body2">{reserva.usuario_nome}</Typography>
                          {/* Opcional: Motivo (se incluído e relevante) */}
                           {reserva.motivo && <Typography variant="caption" color="textSecondary">{reserva.motivo}</Typography>}
                      </Paper>
                  ))}
              </Box>
          </Box>
      ))}

      {/* Mensagem se não houver reservas (tratada na renderização condicional acima) */}

    </Box>
  );
};

export default DashboardPanel;