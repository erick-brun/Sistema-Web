// frontend/src/pages/CalendarPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Importe a instância axios configurada

// Importe o FullCalendar e os plugins necessários
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Plugin para visualizações de dia/mês
import timeGridPlugin from '@fullcalendar/timegrid'; // Plugin para visualizações com horários
import interactionPlugin from '@fullcalendar/interaction'; // Plugin para interatividade (clique, seleção)

// Reutilize interfaces para os dados de reserva e aninhados
interface UsuarioReadData { id: string; nome: string; email: string; /* ... */ }
interface AmbienteReadData { id: number; nome: string; /* ... */ }

interface ReservaData {
  id: number;
  data_inicio: string; // ISO 8601 string
  data_fim: string;    // ISO 8601 string
  motivo: string;
  status: 'pendente' | 'confirmada' | 'cancelada' | 'finalizada';
  usuario: UsuarioReadData; // Dados aninhados
  ambiente: AmbienteReadData; // Dados aninhados
}


function CalendarPage() { // Renomeado
  // State para armazenar a lista de reservas a serem exibidas no calendário
  const [reservas, setReservas] = useState<ReservaData[]>([]);
  // State para lidar com estado de carregamento
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros
  const [error, setError] = useState<string | null>(null);

  // State para armazenar o período visível do calendário (opcional, para carregar apenas reservas relevantes)
  // const [calendarDates, setCalendarDates] = useState<{start: Date, end: Date} | null>(null);


  // useEffect para buscar as reservas para o calendário
  useEffect(() => {
    // Função assíncrona para buscar as reservas
    const fetchReservasForCalendar = async () => {
      try {
        setLoading(true); // Inicia o carregamento
        setError(null); // Limpa erros

        // TODO: Chamar o endpoint GET /reservas/ com FILTROS DE DATA
        // Precisamos carregar as reservas que se encaixam no período visível do calendário.
        // Por enquanto, vamos buscar todas as reservas (ou um grande limite) para simplificar,
        // mas em um sistema real, você filtraria por data.
        // Exemplo de chamada com filtros de data (requer um método para obter as datas visíveis do calendário)
        // const response = await api.get('/reservas/', {
        //   params: {
        //     data_inicio_ge: calendarDates?.start.toISOString(), // Início do período visível
        //     data_fim_le: calendarDates?.end.toISOString(),       // Fim do período visível
        //     status: 'confirmada' // Ex: Mostrar apenas reservas confirmadas no calendário público
        //   }
        // });

        // Simplificado: Buscar as primeiras 1000 reservas (ajuste conforme necessário)
        const response = await api.get('/reservas/', {
           params: {
             limit: 1000,
             // Opcional: filtrar por status que você quer mostrar no calendário público/geral
             // status: 'confirmada' // Mostrar apenas confirmadas?
           }
        });


        // TODO: Adaptar os dados de ReservaData para o formato de Eventos que o FullCalendar espera.
        // O FullCalendar espera um array de objetos com pelo menos 'title', 'start', e 'end'.
        // O 'title' do evento pode ser o motivo, nome do ambiente, etc.
        // 'start' e 'end' devem ser objetos Date ou strings ISO 8601.
        const events = response.data.map((reserva: ReservaData) => ({
          // ID do evento (útil para interação, ex: clicar)
          id: String(reserva.id), // ID deve ser string
          // Título do evento (exibido no calendário)
          // Pode ser o motivo + nome do ambiente, ou apenas nome do ambiente
          title: `${reserva.ambiente.nome} - ${reserva.motivo}`,
          // Datas/horas de início e fim (devem ser objetos Date ou strings ISO 8601)
          start: reserva.data_inicio, // Já vem como string ISO 8601 do backend
          end: reserva.data_fim,      // Já vem como string ISO 8601 do backend
          // Opcional: Adicionar outras propriedades ao evento
          backgroundColor: reserva.status === 'confirmada' ? '#28a745' : reserva.status === 'pendente' ? '#ffc107' : '#dc3545', // Cores por status
          borderColor: reserva.status === 'confirmada' ? '#28a745' : reserva.status === 'pendente' ? '#ffc107' : '#dc3545',
          extendedProps: { // Armazenar dados originais da reserva no evento
             reservaData: reserva, // Objeto ReservaData original
          }
        }));

        // Armazena a lista de eventos formatados no state
        setReservas(events as any); // Usando 'any' temporariamente, tipagem melhor seria FullCalendar.EventInput[]

        console.log('Eventos de reserva formatados para calendário:', events);

      } catch (err: any) {
        console.error('Erro ao obter reservas para calendário:', err);
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar reservas para o calendário.';
        setError(errorMessage);
         // O interceptor 401 já redireciona para login se a rota GET /reservas/ for protegida para USER.
         // Se a rota for pública, este catch lida com outros erros.
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    fetchReservasForCalendar();
    // TODO: Se implementar filtros de data dinâmicos, adicionar calendarDates aqui como dependência
  }, []); // Roda apenas uma vez ao montar (sem filtros de data dinâmicos)


  // TODO: Lidar com cliques nos eventos ou seleção de datas (se interactionPlugin for usado)
  // const handleEventClick = (clickInfo: any) => { // Substituir 'any' por tipo correto de FullCalendar
  //    alert('Você clicou na reserva: ' + clickInfo.event.title);
  //    // Navegar para a página de detalhes da reserva? Ex: navigate(`/reservas/${clickInfo.event.id}`);
  // };
  //
  // const handleDateSelect = (selectInfo: any) => { // Substituir 'any'
  //    // O usuário selecionou um período no calendário.
  //    // Abrir um modal para criar uma nova reserva?
  //    let title = prompt('Por favor, insira o título para sua nova reserva:');
  //    let calendarApi = selectInfo.view.calendar;
  //
  //    calendarApi.unselect(); // Limpa a seleção
  //
  //    if (title) {
  //      // TODO: Chamar o endpoint POST /reservas/ para criar a reserva
  //      // com as datas (selectInfo.start, selectInfo.end), título e um ambiente (precisa selecionar ambiente)
  //      // Após sucesso, adicionar o novo evento ao calendário
  //      // calendarApi.addEvent({...});
  //    }
  // };


  // Renderização condicional
  if (loading) {
    return <div>Carregando calendário de reservas...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h1>Calendário de Reservas</h1>

      {/* Renderizar o componente FullCalendar */}
      <FullCalendar
        plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]} // Plugins a serem usados
        headerToolbar={{ // Configuração do cabeçalho (botões, título)
          left: 'prev,next today', // Botões à esquerda
          center: 'title',         // Título no centro
          right: 'dayGridMonth,timeGridWeek,timeGridDay' // Visualizações à direita (Mês, Semana, Dia)
        }}
        initialView='dayGridMonth' // Visualização inicial (mês)
        locale='pt-br' // Definir idioma (requer plugin de locale, ou configurar manualmente)
        // locales={[ptBrLocale]} // Exemplo se importar o locale específico
        editable={false} // Permitir arrastar e redimensionar eventos? (Geralmente false para visualização)
        selectable={true} // Permitir seleção de datas? (útil para criar reserva clicando/arrastando)
        selectMirror={true} // Mostra um evento "fantasma" durante a seleção
        dayMaxEvents={true} // Permite "more" link quando há muitos eventos em um dia
        // eventClick={handleEventClick} // TODO: Lidar com cliques em eventos
        // select={handleDateSelect} // TODO: Lidar com seleção de datas

        // TODO: Lidar com mudança de visualização ou datas visíveis para carregar dados dinamicamente
        // datesSet={(dateInfo) => setCalendarDates({start: dateInfo.start, end: dateInfo.end})} // Atualiza state com datas visíveis

        events={reservas} // Passa a lista de eventos (reservas formatadas) para o calendário

        // Opcional: Personalizar a aparência dos eventos
        // eventContent={(eventInfo) => {
        //   return (
        //     <>
        //       <b>{eventInfo.timeText}</b> - {eventInfo.event.title}
        //     </>
        //   )
        // }}
      />

      {/* TODO: Adicionar um seletor de ambiente para filtrar o calendário por ambiente */}
    </div>
  );
}

export default CalendarPage;