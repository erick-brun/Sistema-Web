// frontend/src/pages/MyReservasPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
// Importe Link e useNavigate
import { Link, useNavigate } from 'react-router-dom';
// Importe useAuth
import { useAuth } from '../context/AuthContext';

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


  // Função auxiliar para formatar datas para exibição (já existente)
  const formatDateTime = (dateTimeString: string) => {
      const date = new Date(dateTimeString);
      // Opcional: Adicionar tratamento para fuso horário se as datas forem UTC no backend
      // const date = new Date(dateTimeString + 'Z'); // Adicionar 'Z' se for string ISO sem offset, mas é UTC
      return date.toLocaleString(); // Formato amigável
  };


  // Renderização condicional (loading do AuthContext OU loading das Reservas)
  if (authLoading || loadingReservas) {
    return <div>Carregando...</div>; // Exibe mensagem de carregamento
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>; // Exibe mensagem de erro
  }

  // Nota: Se não estiver carregando e não houver erro, e o usuário logado (user) existir,
  // a lista de reservas pode estar vazia.

  return (
    <div>
      <h1>Minhas Reservas</h1>

      {/* Exibir a lista de reservas */}
      {reservas.length > 0 ? (
        <ul>
          {reservas.map(reserva => (
            <li key={reserva.id}>
              {/* Exibir detalhes da reserva (como antes) */}
              <strong>Reserva ID: {reserva.id}</strong> (Status: {reserva.status.toUpperCase()})
              <p>Ambiente: {reserva.ambiente.nome}</p>
              <p>Período: {formatDateTime(reserva.data_inicio)} a {formatDateTime(reserva.data_fim)}</p>
              <p>Motivo: {reserva.motivo}</p>
              <p>Solicitada em: {formatDateTime(reserva.data_criacao)}</p>
              <p>Solicitado por: {reserva.usuario.nome}</p> {/* Acessando dado aninhado */}

              {/* TODO: Adicionar botões para Editar/Cancelar (condicionalmente) */}
              {/* Lógica: Exibir se status for PENDENTE E o usuário logado for o dono da reserva */}
              {/* Assumindo que a API retorna reserva.usuario.id com o ID do dono */}
              {reserva.status === 'pendente' && user?.id === reserva.usuario.id && (
                  <> {/* Fragmento React para agrupar botões */}
                     {/* Botão Editar */}
                     {/* Use um Link se a edição for em outra página, ou um botão para modal */}
                     <button onClick={() => handleEdit(reserva.id)}>Editar</button> {/* Chama handleEdit passando o ID */}
                     {' '} {/* Espaço entre botões */}
                     {/* Botão Cancelar */}
                     <button
                         onClick={() => handleCancel(reserva.id)} // Chama handleCancel passando o ID
                         disabled={cancelingReservaId === reserva.id} // Desabilita durante o cancelamento
                     >
                         {cancelingReservaId === reserva.id ? 'Cancelando...' : 'Cancelar'} {/* Texto dinâmico */}
                     </button>
                  </>
              )}
               <p></p> {/* Espaço entre itens da lista */}
            </li>
          ))}
        </ul>
      ) : (
        // Mensagem se não houver reservas
        <p>Você não tem nenhuma reserva cadastrada.</p>
      )}

      {/* TODO: Adicionar link ou botão para solicitar uma nova reserva */}
       <p>
         <Link to="/solicitar-reserva">Solicitar Nova Reserva</Link> {/* Link para a página de solicitação */}
       </p>

    </div>
  );
}

export default MyReservasPage;