// frontend/src/pages/MyReservasPage.tsx

import React, { useEffect, useState, useCallback } from 'react'; // Importar useCallback
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importar componentes de Material UI para listas e layout
import { Box, Typography, CircularProgress, List, ListItem, ListItemText, Paper, Button } from '@mui/material';
import theme from '../theme';

// Reutilize ou defina interfaces para os dados aninhados
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


function MyReservasPage() {
  const navigate = useNavigate();
  // Obtenha o usuário logado do contexto
  const { user, loading: authLoading } = useAuth(); // Obtenha o usuário logado e o estado de loading do auth context

  const [reservas, setReservas] = useState<ReservaData[]>([]);
  const [loadingReservas, setLoadingReservas] = useState<boolean>(true); // Renomeado para clareza
  const [error, setError] = useState<string | null>(null);

  // State para controlar qual reserva está sendo cancelada (para desabilitar botão temporariamente)
  const [cancelingReservaId, setCancelingReservaId] = useState<number | null>(null);


  // useEffect para buscar a lista de reservas do usuário logado
  useEffect(() => {
    const fetchMyReservas = async () => {
      try {
        setLoadingReservas(true); // Inicia o carregamento das reservas
        setError(null);

        // Precisamos do ID do usuário logado. Obtemos ele do contexto (user.id).
        // Certifique-se que o usuário está carregado e tem um ID antes de buscar reservas.
        if (!user?.id) {
             // Se user for null ou não tiver ID (deveria ser pego pelo ProtectedRoute/AuthContext load)
             // Isso pode acontecer se o contexto ainda estiver carregando ou falhou ao carregar.
             // O AuthContext agora tem um estado 'loading'. Esperamos que ele carregue.
             // Podemos adicionar uma checagem de loading do contexto aqui se necessário,
             // mas o useEffect com [user?.id] deve ser suficiente.
             console.log("User ID não disponível, pulando busca de reservas.");
             setLoadingReservas(false);
             return;
        }
         console.log("Buscando reservas para usuário:", user.id); // Debug

        // Chama o endpoint GET /reservas/, filtrando pelo ID do usuário logado.
        // Esta rota agora permite que usuários comuns filtrem apenas por si mesmos (backend ajustado).
        const response = await api.get('/reservas/', {
          params: {
            usuario_id: user.id, // Passa o ID do usuário logado
            // Opcional: outros filtros (status, datas)
          }
        });

        setReservas(response.data);
        console.log('Lista de reservas do usuário obtida:', response.data);

      } catch (err: any) {
        console.error('Erro ao obter lista de minhas reservas:', err);
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar minhas reservas.';
        setError(errorMessage);
         // O interceptor 401 já redireciona para login.
         // Este catch lida com outros erros (ex: 500, ou 403 se a lógica backend não estiver 100% certa).
      } finally {
        setLoadingReservas(false); // Finaliza o carregamento
      }
    };

    // Roda a busca APENAS se o user?.id estiver disponível
    if (user?.id) {
      fetchMyReservas();
    }
    // Adiciona user?.id como dependência. Se o usuário for carregado no contexto, a busca rodará.
  }, [user?.id, api]); // Adiciona 'api' como dependência se ela puder mudar (geralmente não muda)


  // Função para lidar com a ação de Cancelar Reserva
  const handleCancel = async (reservaId: number) => {
     console.log(`Tentando cancelar reserva com ID: ${reservaId}`); // Debug
     // debugger; // Opcional

     // **ADICIONADO:** Lógica de confirmação com o usuário
     if (!window.confirm("Tem certeza que deseja cancelar esta reserva? Esta ação não poderá ser desfeita.")) {
         // Se o usuário clicar em "Cancelar" na pop-up de confirmação, interrompe a função.
         console.log(`Cancelamento de reserva ${reservaId} abortado pelo usuário.`); // Debug
         return;
     }

     setCancelingReservaId(reservaId); // Inicia estado de cancelamento para este ID
     setError(null); // Limpa erros


     try {
        console.log(`Chamando API para cancelar reserva ${reservaId}...`); // Debug
        // **CORREÇÃO FINAL ANTERIOR:** Enviar o nome do campo correto 'novo_status' no corpo JSON.
        const response = await api.patch(`/reservas/${reservaId}/status`, { novo_status: 'cancelada' }); // <--- CAMPO CORRETO!
        console.log(`API de cancelamento retornou:`, response); // Debug de sucesso


        // Lógica de atualização da lista local após sucesso (remover a reserva cancelada)
        console.log(`Removendo reserva ${reservaId} da lista local...`); // Debug
        setReservas(prevReservas => prevReservas.filter(reserva => reserva.id !== reservaId));
        console.log(`Reserva ${reservaId} removida da lista local.`); // Debug


        // Opcional: Exibir mensagem de sucesso (pode usar um estado de sucesso e exibir no componente)
        // setSuccessMessage(`Reserva ${reservaId} cancelada com sucesso.`);

     } catch (err: any) {
        console.error(`Erro no catch de handleCancel para reserva ${reservaId}:`, err); // Debug de erro

        // Lógica para extrair e exibir mensagem de erro (como aprimorado anteriormente)
        let messageToDisplay = 'Erro desconhecido ao cancelar reserva.';
        // ... (lógica de extração de mensagem de erro de err.response.data.detail) ...
        if (err.response && err.response.data && err.response.data.detail) {
             if (Array.isArray(err.response.data.detail)) {
                 messageToDisplay = err.response.data.detail.map((e: any) => e.msg).join('; ');
             } else if (typeof err.response.data.detail === 'string') {
                 messageToDisplay = err.response.data.detail;
             } else {
                 messageToDisplay = err.message;
             }
         } else {
              messageToDisplay = err.message;
         }
        setError(messageToDisplay); // Define a mensagem de erro formatada

     } finally {
        setCancelingReservaId(null); // Finaliza estado de cancelamento
        console.log(`handleCancel finalizado para reserva ${reservaId}.`); // Debug
     }
  };


  // Função para lidar com a ação de Editar Reserva
  const handleEdit = (reservaId: number) => {
      console.log(`Editando reserva ${reservaId}`);
      // **IMPLEMENTAÇÃO:** Navegar para a página de edição, passando o ID da reserva na URL.
      // A rota de edição foi definida como /reservas/editar/:reservaId
      navigate(`/reservas/editar/${reservaId}`); // <--- Navega para a rota de edição com o ID
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


  // Renderização condicional (loading/error)
  if (authLoading || loadingReservas) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}> {/* Centralizar spinner */}
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando minhas reservas...</Typography>
        </Box>
    );
  }

  if (error) {
    return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
  }


  return (
    // **ADICIONADO:** Container principal da página (cinza claro)
    <Box sx={{ padding: 3, backgroundColor: theme.palette.background.default }}> {/* Padding e fundo cinza */}
      <Typography variant="h4" component="h1" gutterBottom>Minhas Reservas</Typography> {/* Título */}

      {/* Exibir a lista de reservas */}
      {reservas.length > 0 ? (
        // **MODIFICADO:** Usar componentes List, ListItem, ListItemText, Paper
        <List component={Paper} elevation={2} sx={{ padding: 2 }}> {/* Lista dentro de um Paper com sombra */}
          {reservas.map(reserva => (
            // Cada item da lista
            <ListItem
               key={reserva.id}
               // Opcional: Tornar o item inteiro clicável (para ver detalhes? Se tiver página de detalhes de reserva)
               // component={Link} to={`/reservas/${reserva.id}`}
               divider // Adicionar um divisor entre os itens
               sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }} // Efeito hover sutil usando tema
            >
              <ListItemText // Texto principal e secundário do item
                 primary={
                    // Conteúdo principal: Ambiente, Período, Status
                    <> {/* Fragmento para agrupar */}
                       <Typography variant="h6">
                          {reserva.ambiente.nome} (Status: {reserva.status.toUpperCase()})
                       </Typography>
                       <Typography variant="body1">
                           {formatDateTimeLocal(reserva.data_inicio)} a {formatDateTimeLocal(reserva.data_fim)} {/* Usar a função para horário local */}
                       </Typography>
                    </>
                 }
                 secondary={
                    // Conteúdo secundário: Motivo, Solicitado Por (usuário logado), Solicitada Em, Botões
                    <> {/* Fragmento para agrupar */}
                       <Typography variant="body2" color="textSecondary">Motivo: {reserva.motivo}</Typography>
                       {/* Usuário solicitante (é o próprio usuário logado nesta página) */}
                       <Typography variant="body2" color="textSecondary">Solicitado por: {reserva.usuario.nome}</Typography> {/* Acessando dado aninhado */}
                       <Typography variant="body2" color="textSecondary">Solicitada em: {formatDateTimeUtc(reserva.data_criacao)}</Typography> {/* Usar a função para horário UTC */}

                       {/* Botões para Editar/Cancelar (condicionalmente) */}
                       {/* Lógica: Exibir se status for PENDENTE E o usuário logado for o dono da reserva */}
                       {/* A lógica de permissão está no backend e a condição aqui é para UX */}
                       {reserva.status === 'pendente' && user?.id === reserva.usuario.id && (
                           <Box mt={1}> {/* Espaço acima dos botões */}
                              {/* Botão Editar */}
                              {/* Use um Link se a edição for em outra página, ou um botão para modal */}
                              <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleEdit(reserva.id)} // Chama handleEdit passando o ID
                              >
                                  Editar
                              </Button>
                              {' '} {/* Espaço */}
                              {/* Botão Cancelar */}
                              <Button
                                  variant="outlined"
                                  color="error" // Cor vermelha para erro
                                  size="small"
                                  onClick={() => handleCancel(reserva.id)} // Chama handleCancel passando o ID
                                  disabled={cancelingReservaId === reserva.id} // Desabilita durante o cancelamento
                              >
                                  {cancelingReservaId === reserva.id ? 'Cancelando...' : 'Cancelar'} {/* Texto dinâmico */}
                              </Button>
                           </Box>
                       )}
                    </>
                 }
              />
               {/* Opcional: Adicionar uma div ou Box extra para espaçamento entre itens se o divider não for suficiente */}
               {/* <Box sx={{ mb: 2 }}></Box> */} {/* Exemplo: margin bottom de 16px */}

            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1">Você não tem nenhuma reserva cadastrada.</Typography> // Mensagem se lista vazia
      )}

      {/* TODO: Adicionar funcionalidade de paginação ou filtros aqui (menos comum para "Minhas Reservas") */}
       <Box mt={3}>
          {/* Links ou botões de paginação/filtros */}
       </Box>


      {/* Link para solicitar nova reserva */}
       <Box mt={3}>
         <Button variant="contained" component={Link} to="/solicitar-reserva">Solicitar Nova Reserva</Button> {/* Usar Button component Link */}
       </Box>

    </Box>
  );
}

export default MyReservasPage;