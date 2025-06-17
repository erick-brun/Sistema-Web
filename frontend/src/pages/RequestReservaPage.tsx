// frontend/src/pages/RequestReservaPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Importe a instância axios configurada
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'; // Para link de volta
// Opcional: Importar componentes de data/hora picker (ex: @mui/x-date-pickers)
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';


// Reutilize a interface AmbienteData (para popular o seletor de ambiente)
interface AmbienteData {
  id: number;
  nome: string;
  capacidade: number;
  // ... outros campos se precisar
}

// Interface para os dados do formulário (ReservaCreate - backend espera esses campos)
interface ReservaFormData {
  ambiente_id: number | ''; // Pode começar vazio, usar '' para select
  data_inicio: string;
  data_fim: string;
  motivo: string;
}

// Interface para dados de Reserva Read (para carregar os dados existentes para edição)
interface ReservaReadData { // Baseado no schema ReservaRead do backend
  id: number;
  data_inicio: string; // ISO 8601 string
  data_fim: string;    // ISO 8601 string
  motivo: string;
  ambiente: { id: number; nome: string; /* ... */ }; // Apenas os dados relevantes aninhados
  // ... outros campos que precisa carregar para pré-popular ou exibir
}

function RequestReservaPage() {
  // **MODIFICAR:** Use useParams para obter reservaId (será string ou undefined)
  const { reservaId } = useParams<{ reservaId: string }>(); // Pode ser string ou undefined

  const navigate = useNavigate();

  // State para os dados do formulário de reserva
  const [formData, setFormData] = useState<ReservaFormData>({
    ambiente_id: '',
    data_inicio: '',
    data_fim: '',
    motivo: '',
  });

  // State para a lista de ambientes (como antes)
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);

  // **MODIFICAR:** State para lidar com estado de carregamento (ambientes, RESERVA EXISTENTE, submissão)
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true); // Carregando ambientes OU dados da reserva existente
  const [submitting, setSubmitting] = useState<boolean>(false);

  // State para lidar com mensagens de erro e sucesso (como antes)
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  // **NOVO useEffect:** Para carregar dados da reserva EXISTENTE se em modo edição
  useEffect(() => {
      const fetchReservaDetails = async () => {
          try {
              setLoadingInitialData(true); // Inicia carregamento
              setError(null);

              // **Verifica se estamos no modo edição (reservaId existe)**
              if (reservaId) {
                  console.log(`Modo edição: Carregando dados da reserva ${reservaId}`);
                  // Chama o endpoint GET /reservas/{reserva_id} para obter os detalhes da reserva existente
                  // Esta rota requer autenticação
                  const response = await api.get(`/reservas/${reservaId}`);
                  const reservaData: ReservaReadData = response.data;

                  // **Pré-popula o formulário com os dados da reserva existente**
                  setFormData({
                      ambiente_id: reservaData.ambiente.id, // Usar o ID do ambiente aninhado
                      data_inicio: reservaData.data_inicio,
                      data_fim: reservaData.data_fim,
                      motivo: reservaData.motivo,
                  });
                  console.log("Formulário pré-populado para edição:", reservaData);

              } else {
                  // Modo criação: Nenhuma ação necessária aqui, apenas marca como carregado inicial
                  console.log("Modo criação: Formulário vazio.");
              }

          } catch (err: any) {
              console.error(`Erro ao carregar dados da reserva ${reservaId} para edição:`, err);
              const errorMessage = err.response?.data?.detail || 'Erro ao carregar dados da reserva para edição.';
              setError(errorMessage);
               // Opcional: Redirecionar se 404 (reserva não encontrada)
               if (err.response && err.response.status === 404) {
                   navigate('/minhas-reservas'); // Redireciona para minhas reservas
               }
          } finally {
              setLoadingInitialData(false); // Finaliza carregamento inicial (da reserva, se edição)
          }
      };

      fetchReservaDetails();
  }, [reservaId, navigate]); // Dependências: roda quando reservaId muda, e inclui navigate


  // **useEffect existente:** Para carregar a lista de ambientes (agora roda SEMPRE, tanto em criação quanto edição)
  // É importante que os ambientes estejam carregados para popular o select em AMBOS os modos.
  useEffect(() => {
    const fetchAmbientes = async () => {
      try {
        // Não sobrescreve loadingInitialData aqui, pois o useEffect acima gerencia isso.
        // Poderia usar um estado de loading separado para apenas ambientes se necessário.
        const response = await api.get('/ambientes/', { params: { ativo: true } });

        setAmbientes(response.data);
        console.log('Lista de ambientes para solicitação obtida:', response.data);

      } catch (err: any) {
        console.error('Erro ao obter lista de ambientes para solicitação:', err);
        // Erro ao carregar ambientes é um erro que impede criação/edição.
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar ambientes disponíveis.';
        setError(errorMessage);
      } finally {
        // loadingInitialData é gerenciado pelo useEffect acima
      }
    };

    fetchAmbientes();
    // Não adicionar reservaId como dependência aqui, pois ambientes só precisam carregar uma vez.
  }, []); // Roda apenas uma vez ao montar


  // Função para lidar com a mudança nos inputs do formulário (como antes)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'ambiente_id' ? Number(value) : value, // Converte ambiente_id para number
    });
  };

  // Função para lidar com submissão do formulário de reserva (AGORA LIDA COM CRIAÇÃO E EDIÇÃO)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    // Validação básica no frontend (como antes)
    if (!formData.ambiente_id || !formData.data_inicio || !formData.data_fim || !formData.motivo) {
      setError('Por favor, preencha todos os campos.');
      setSubmitting(false);
      return;
    }
     // TODO: Adicionar validação de datas no frontend (futuras, início < fim).

    try {
      // Prepara os dados para enviar.
      const dataToSend = {
          ambiente_id: formData.ambiente_id,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim,
          motivo: formData.motivo,
      };

      let response;
      let successMessageText;

      // **MODIFICADO:** Lógica para escolher entre POST (criar) e PATCH (editar)
      if (reservaId) {
          // Modo edição: Chamar endpoint PATCH para atualizar a reserva
          console.log(`Modo edição: Enviando atualização para reserva ${reservaId}`);
          // PATCH /reservas/{reserva_id} requer autenticação.
          // O backend (CRUD) lida com permissão (dono se PENDENTE ou admin).
          // O backend também re-verifica disponibilidade se datas/ambiente mudarem.
          response = await api.patch(`/reservas/${reservaId}`, dataToSend); // Envia JSON
          successMessageText = 'Reserva atualizada com sucesso!';

      } else {
          // Modo criação: Chamar endpoint POST para criar nova reserva
          console.log("Modo criação: Enviando solicitação de nova reserva.");
          // POST /reservas/ requer autenticação.
          // O backend (CRUD) lida com a disponibilidade e status inicial PENDENTE.
          response = await api.post('/reservas/', dataToSend); // Envia JSON
          successMessageText = 'Reserva solicitada com sucesso! Aguardando confirmação.';
      }


      // Se a requisição for bem-sucedida (status 200 OK para PATCH, 201 Created para POST)
      // Axios considera qualquer 2xx como sucesso por padrão.
      if (response.status === 200 || response.status === 201) {
        console.log('Operação de reserva bem-sucedida:', response.data);
        setSuccessMessage(successMessageText);
        // Opcional: Limpar o formulário APENAS SE FOR CRIAÇÃO
        if (!reservaId) {
             setFormData({ ambiente_id: '', data_inicio: '', data_fim: '', motivo: '' });
        }
        // Redirecionar para a página de "Minhas Reservas" APÓS SUCESSO (em ambos os modos)
        // Pode adicionar um pequeno delay para o usuário ver a mensagem de sucesso
        setTimeout(() => { navigate('/minhas-reservas'); }, 1500); // Redireciona após 1.5 segundos

      } else {
         // Teoricamente, o axios lança erro para status != 2xx. Este else é mais para segurança.
         setError('Erro inesperado ao processar reserva.');
      }

    } catch (err: any) {
      console.error('Operação de reserva falhou:', err);

      // Lida com erros específicos do backend (ex: 409 Conflict, 403 Forbidden, 400 Bad Request)
      const errorMessage = err.response?.data?.detail || 'Erro desconhecido ao processar reserva.';
      setError(errorMessage);

    } finally {
      setSubmitting(false); // Finaliza estado de submissão
    }
  };


  // **MODIFICAR Renderização Condicional:** Lidar com carregamento inicial (de ambientes OU dados da reserva)
  if (loadingInitialData) {
    return <div>Carregando formulário de reserva...</div>;
  }

  // Nota: Erros ao carregar a reserva existente (404, etc.) são tratados pelo redirecionamento no useEffect.
  // Erros na submissão são exibidos acima do formulário.
  // Erros ao carregar a lista de ambientes também são exibidos acima do formulário.

  // Determinar o título da página e o texto do botão de submit com base no modo (criação vs edição)
  const pageTitle = reservaId ? 'Editar Reserva Existente' : 'Solicitar Nova Reserva';
  const submitButtonText = submitting ? 'Enviando...' : (reservaId ? 'Atualizar Reserva' : 'Solicitar Reserva');


  return (
    <div>
      {/* **MODIFICADO:** Título dinâmico */}
      <h1>{pageTitle}</h1>

      {/* Exibe mensagens de erro ou sucesso (como antes) */}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Formulário de solicitação/edição de reserva */}
      {/* **MODIFICADO:** Botão de submit com texto dinâmico e estado disabled */}
      <form onSubmit={handleSubmit}>
        {/* Campo Ambiente */}
        <div>
          <label htmlFor="ambiente_id">Ambiente:</label>
          <select
            id="ambiente_id"
            name="ambiente_id"
            value={formData.ambiente_id}
            onChange={handleChange}
            required
            // **Opcional:** Desabilitar o seletor de ambiente no modo edição?
            // Geralmente não se muda o ambiente em uma reserva existente. Mas a regra de negócio permite.
            // disabled={!!reservaId} // Desabilita se reservaId existir
          >
            <option value="">-- Selecione um Ambiente --</option>
            {ambientes.map(ambiente => (
              <option key={ambiente.id} value={ambiente.id}>{ambiente.nome} (Cap: {ambiente.capacidade})</option>
            ))}
          </select>
          {/* Opcional: Mostrar o nome do ambiente em texto no modo edição se o select estiver desabilitado */}
          {/* {!!reservaId && ambiente && <p>Ambiente selecionado: {ambiente.nome}</p>} */}
        </div>

        {/* Campos de Data/Hora e Motivo (como antes) */}
        <div>
          <label htmlFor="data_inicio">Data e Hora de Início:</label>
          <input
            type="datetime-local"
            id="data_inicio"
            name="data_inicio"
            value={formData.data_inicio}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="data_fim">Data e Hora de Fim:</label>
          <input
            type="datetime-local"
            id="data_fim"
            name="data_fim"
            value={formData.data_fim}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="motivo">Motivo da Reserva:</label>
          <textarea
            id="motivo"
            name="motivo"
            value={formData.motivo}
            onChange={handleChange}
            required
            rows={4}
            maxLength={100}
          />
        </div>

        {/* Botão para enviar o formulário */}
        <button type="submit" disabled={submitting || loadingInitialData || ambientes.length === 0}> {/* Desabilitar se ambientes não carregaram */}
           {submitButtonText} {/* Texto dinâmico */}
        </button>

      </form>

      {/* Link para voltar */}
       <p>
         {/* Decida para onde voltar: lista de minhas reservas ou início */}
         <Link to="/minhas-reservas">Ver minhas reservas</Link> | <Link to="/home">Voltar para o início</Link>
       </p>

    </div>
  );
}

export default RequestReservaPage;