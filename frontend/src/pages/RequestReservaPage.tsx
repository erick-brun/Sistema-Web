// frontend/src/pages/RequestReservaPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Importe a instância axios configurada
import { useNavigate } from 'react-router-dom'; // Para redirecionamento após sucesso
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


function RequestReservaPage() { // Renomeado
  const navigate = useNavigate();

  // State para os dados do formulário de reserva
  const [formData, setFormData] = useState<ReservaFormData>({
    ambiente_id: '',
    data_inicio: '',
    data_fim: '',
    motivo: '',
  });

  // State para a lista de ambientes disponíveis para popular o seletor
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  // State para lidar com estado de carregamento (para ambientes e submissão)
  const [loadingAmbientes, setLoadingAmbientes] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false); // Estado para submissão do formulário

  // State para lidar com mensagens de erro e sucesso
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  // useEffect para carregar a lista de ambientes quando o componente é montado
  useEffect(() => {
    const fetchAmbientes = async () => {
      try {
        setLoadingAmbientes(true);
        setError(null);

        // Chama o endpoint GET /ambientes/ (agora requer autenticação).
        // Opcional: Filtrar apenas ambientes ativos aqui ou no backend.
        const response = await api.get('/ambientes/', { params: { ativo: true } }); // Filtrar por ativo=true

        setAmbientes(response.data);
        console.log('Lista de ambientes para solicitação obtida:', response.data);

      } catch (err: any) {
        console.error('Erro ao obter lista de ambientes para solicitação:', err);
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar ambientes disponíveis.';
        setError(errorMessage);
         // O interceptor 401 já redireciona para login se necessário.
      } finally {
        setLoadingAmbientes(false);
      }
    };

    fetchAmbientes();
  }, []); // Roda apenas uma vez ao montar


  // Função para lidar com a mudança nos inputs do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      // Tratar campos numéricos se necessário (ex: converter value para number)
      [name]: name === 'ambiente_id' ? Number(value) : value,
    });
  };

  // Função para lidar com submissão do formulário de reserva
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Previne o comportamento padrão

    setError(null); // Limpa mensagens
    setSuccessMessage(null);
    setSubmitting(true); // Inicia estado de submissão

    // Validação básica no frontend
    if (!formData.ambiente_id || !formData.data_inicio || !formData.data_fim || !formData.motivo) {
      setError('Por favor, preencha todos os campos.');
      setSubmitting(false);
      return;
    }
    // Opcional: Validação de datas (futuras, início < fim) aqui também,
    // embora o backend já faça isso via validadores de schema ReservaBase.


    try {
      // Prepara os dados para enviar. O backend espera um objeto com ambiente_id, data_inicio, data_fim, motivo.
      // As datas/horas devem estar no formato ISO 8601 (strings).
      // Se estiver usando input type="datetime-local", o .value já é uma string ISO 8601 (sem offset).
      const dataToSend = {
          ambiente_id: formData.ambiente_id,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim,
          motivo: formData.motivo,
      };

      // Envia a requisição POST para o endpoint de criação de reserva.
      // POST /reservas/ requer autenticação (usuário logado).
      const response = await api.post('/reservas/', dataToSend); // Envia JSON

      // Se a requisição for bem-sucedida (status 201 Created)
      if (response.status === 201) {
        console.log('Reserva criada com sucesso:', response.data);
        setSuccessMessage('Reserva solicitada com sucesso! Aguardando confirmação.');
        // Opcional: Limpar o formulário após sucesso
        setFormData({ ambiente_id: '', data_inicio: '', data_fim: '', motivo: '' });
        // Opcional: Redirecionar para a página de "Minhas Reservas"
        // setTimeout(() => { navigate('/minhas-reservas'); }, 2000);
      } else {
         setError('Erro inesperado ao solicitar reserva.');
      }

    } catch (err: any) {
      console.error('Solicitação de reserva falhou:', err);

      // Lida com erros específicos do backend (ex: 409 Conflict - indisponível, 400 Bad Request - validação)
      const errorMessage = err.response?.data?.detail || 'Erro desconhecido ao solicitar reserva.';
      setError(errorMessage);

    } finally {
      setSubmitting(false); // Finaliza estado de submissão
    }
  };


  // Renderização condicional baseada nos estados de carregamento e erro
  if (loadingAmbientes) {
    return <div>Carregando ambientes disponíveis...</div>;
  }

  if (error && !successMessage) { // Exibe erro apenas se não houver sucesso
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div>
      <h1>Solicitar Nova Reserva</h1>

      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Formulário de solicitação de reserva */}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="ambiente_id">Ambiente:</label>
          <select
            id="ambiente_id"
            name="ambiente_id" // Nome deve corresponder à chave no state/formData
            value={formData.ambiente_id}
            onChange={handleChange} // Usa a mesma função handleChange
            required
          >
            <option value="">-- Selecione um Ambiente --</option>
            {ambientes.map(ambiente => (
              // O value deve ser o ID do ambiente (número), mas o select HTML lida com strings, então convertemos no handleChange
              <option key={ambiente.id} value={ambiente.id}>{ambiente.nome} (Cap: {ambiente.capacidade})</option>
            ))}
          </select>
        </div>

        <div>
          {/* Use input type="datetime-local" para facilitar a seleção de data e hora */}
          {/* Nota: O valor é uma string ISO 8601 sem informações de fuso horário */}
          {/* O backend (validadores de schema) lida com a conversão para UTC */}
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
          <textarea // Usar textarea para motivo longo
            id="motivo"
            name="motivo"
            value={formData.motivo}
            onChange={handleChange}
            required
            rows={4} // Opcional: definir número de linhas visíveis
            maxLength={100} // Opcional: limitar caracteres como no backend (o backend valida também)
          />
        </div>

        {/* Botão para enviar o formulário */}
        <button type="submit" disabled={submitting || loadingAmbientes}>
           {submitting ? 'Enviando...' : 'Solicitar Reserva'} {/* Exibe texto diferente durante submissão */}
        </button>

      </form>

      {/* Link para voltar para a página inicial ou de reservas */}
      <p>
        <Link to="/minhas-reservas">Ver minhas reservas</Link> | <Link to="/home">Voltar para o início</Link>
      </p>
    </div>
  );
}

export default RequestReservaPage;