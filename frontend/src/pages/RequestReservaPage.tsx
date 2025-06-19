// frontend/src/pages/RequestReservaPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Typography, Box, CircularProgress, Paper } from '@mui/material';
import theme from '../theme';

// Reutilizar interfaces (já definidas)
// Interface AmbienteData (para popular o seletor de ambiente) - Defina-a aqui se não for globalmente
interface AmbienteData {
  id: number;
  nome: string;
  capacidade: number;
  // ... outros campos se precisar
}

// Reutilizar a interface UsuarioData (para popular seletor para admin) - Defina-a aqui se não for globalmente
interface UsuarioData {
  id: string; // UUID como string
  nome: string;
  email: string;
  // ... outros campos se precisar (não precisa da senha, etc.)
}

// Interface para dados de Reserva Read (para carregar os dados existentes para edição) - Defina-a aqui se não for globalmente
interface ReservaReadData {
  id: number;
  data_inicio: string;
  data_fim: string;
  motivo: string;
  ambiente: { id: number; nome: string; }; // Assumindo estrutura mínima necessária
  usuario: { id: string; nome: string; email: string; }; // Assumindo estrutura mínima necessária
  // ... outros campos
}

// Interface para os dados do formulário (ReservaCreate/Update)
interface ReservaFormData {
  ambiente_id: number | '';
  data_inicio: string;
  data_fim: string;
  motivo: string;
  // Nota: usuario_id NÃO está neste schema, é enviado como Query Param se admin
}


function RequestReservaPage() {
  const { reservaId } = useParams<{ reservaId: string }>(); // Pode ser string ou undefined
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // <--- Obtenha o usuário logado e loading

  // State para os dados do formulário de reserva
  const [formData, setFormData] = useState<ReservaFormData>({
    ambiente_id: '',
    data_inicio: '',
    data_fim: '',
    motivo: '',
  });

  // State para a lista de ambientes disponíveis (como antes)
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  // **NOVO ESTADO:** State para a lista de usuários (para popular seletor para admin)
  const [users, setUsers] = useState<UsuarioData[]>([]);
  // **NOVO ESTADO:** State para o ID do usuário SELECIONADO no formulário (apenas para admin)
  // Inicia com o ID do usuário logado (se admin), ou vazio. Será enviado como Query Param.
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);


  // State para lidar com estado de carregamento (dados iniciais, submissão, validação de disponibilidade)
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  // **NOVO ESTADO:** Estado para o loading da validação de disponibilidade
  const [validatingAvailability, setValidatingAvailability] = useState<boolean>(false); // Indica se está verificando disponibilidade


  // State para lidar com mensagens de erro (geral e de validação de formulário frontend)
  const [error, setError] = useState<string | null>(null); // Erros gerais de API ou carregamento inicial
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formSubmissionError, setFormSubmissionError] = useState<string | null>(null); // Erro da submissão da API

  // **NOVO ESTADO:** Erros específicos de validação frontend (por campo)
  const [formErrors, setFormErrors] = useState<{[key: string]: string | undefined}>({}); // Usar undefined para sem erro


  // useEffect principal: Carregar dados iniciais (ambientes, reserva existente, lista de usuários para admin)
  useEffect(() => {
    const fetchInitialData = async () => {
        // ... (lógica para verificar user?.id, authLoading, try...catch...finally) ...
        // Esta função contém a lógica de busca e atualização dos states (ambientes, users, formData, selectedUserId).
         console.log("Iniciando fetchInitialData..."); // Debug
        try {
            setLoadingInitialData(true); // Inicia carregamento
            setError(null);
            setSuccessMessage(null); // Limpa mensagens anteriores
            setFormSubmissionError(null); // Limpa erros de submissão

            // Carregar Lista de Ambientes (sempre)
            const ambientesResponse = await api.get('/ambientes/', { params: { ativo: true } });
            setAmbientes(ambientesResponse.data);

            // Carregar Lista de Usuários (APENAS se admin)
            let fetchedUsers: UsuarioData[] = [];
            if (user?.tipo === 'admin') {
                 const usersResponse = await api.get('/usuarios/');
                 fetchedUsers = usersResponse.data;
                 setUsers(fetchedUsers);
                 // **ADICIONADO:** Pré-selecionar usuário logado como default para admin na criação
                 if (!reservaId && user?.id) { // Se em modo criação E usuário logado existir
                      setSelectedUserId(user.id); // <--- Pré-seleciona o ID do usuário logado
                      console.log(`Admin pré-selecionado usuário logado (${user.id}) na criação.`); // Debug
                 }
            } else {
                setUsers([]);
            }


            // **Carregar Dados da Reserva Existente (SE em modo edição)**
            if (reservaId) {
                console.log(`Modo edição: Carregando dados da reserva ${reservaId}`);
                const reservaResponse = await api.get(`/reservas/${reservaId}`); // GET /reservas/:reservaId requer qualquer logado
                const reservaData: ReservaReadData = reservaResponse.data;

                // **Pré-popula o formulário com os dados da reserva existente**
                setFormData({
                    ambiente_id: reservaData.ambiente.id,
                    data_inicio: reservaData.data_inicio,
                    data_fim: reservaData.data_fim,
                    motivo: reservaData.motivo,
                });
                console.log("Formulário pré-populado para edição:", reservaData);

                // Pré-selecionar o usuário associado à reserva (no modo edição)
                 if (user?.tipo === 'admin') {
                     setSelectedUserId(reservaData.usuario.id); // <--- Pré-seleciona o usuário da reserva existente
                 } // Para usuário comum, o seletor não aparece.

            } else {
                // Modo criação: Formulário vazio.
                console.log("Modo criação: Formulário vazio.");
                // A pré-seleção do usuário logado para admin na criação já foi feita acima.
            }


        } catch (err: any) {
            console.error(`Erro ao carregar dados iniciais para formulário de reserva (Reserva ${reservaId || 'Nova'}):`, err);
            const errorMessage = err.response?.data?.detail || 'Erro ao carregar dados para o formulário.';
            setError(errorMessage);
             if (err.response && err.response.status === 404 && reservaId) {
                 navigate('/minhas-reservas');
             }
        } finally {
            setLoadingInitialData(false); // Finaliza carregamento inicial
            console.log("fetchInitialData finalizado."); // Debug
        }
    };

    // **CORREÇÃO:** Chame a função assíncrona aqui dentro do useEffect.
    // O useEffect não pode ser assíncrono diretamente, então definimos a função assíncrona
    // e a chamamos imediatamente.
    fetchInitialData(); // <--- CHAME A FUNÇÃO AQUI!


    // Roda quando reservaId muda, user?.id ou authLoading mudam.
    // Garante que o efeito roda quando o estado de autenticação é carregado.
  }, [reservaId, user?.id, authLoading, navigate]); // Dependências (navigate para evitar warning)



  // Função para lidar com a mudança nos inputs do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Lida com inputs checkbox (boolean)
    if (type === 'checkbox') {
       const checked = (e.target as HTMLInputElement).checked;
       setFormData({
           ...formData,
           [name]: checked,
       });
    } else {
       // Lida com inputs de texto, número, select, textarea
       // Verifica se o campo que mudou é o seletor de usuário (para admin)
       if (name === 'selectedUserId') {
            setSelectedUserId(value); // Atualiza o state do usuário selecionado (valor é string UUID)
       } else {
           setFormData({
               ...formData,
               [name]: name === 'ambiente_id' && value !== '' ? parseInt(value, 10) : value, // Convertendo ambiente_id para number
           });
       }
    }
     // Limpar erro de validação frontend para este campo ao digitar (opcional)
     // setFormErrors({...formErrors, [name]: undefined}); // Se usar validação frontend
  };


  // **MODIFICADO:** Função para validar datas no frontend (usando API nativa Date, comparando LOCALMENTE)
  const validateDates = (): {[key: string]: string | undefined} => {
      const errors: {[key: string]: string | undefined} = {};

      if (!formData.data_inicio) errors.data_inicio = 'Data de início é obrigatória.';
      if (!formData.data_fim) errors.data_fim = 'Data de fim é obrigatória.';
      if (errors.data_inicio || errors.data_fim) return errors;

      // Tentar parsear as datas (vindos como string YYYY-MM-DDTHH:mm de input type="datetime-local")
      // Estas strings são interpretadas no fuso horário LOCAL pelo navegador.
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      try {
           // Usar new Date() para parsear no fuso horário LOCAL.
           startDate = new Date(formData.data_inicio);
           endDate = new Date(formData.data_fim);

           // Verificar se o parseamento foi bem-sucedido
           if (isNaN(startDate.getTime())) throw new Error("Invalid start date");
           if (isNaN(endDate.getTime())) throw new Error("Invalid end date");

      } catch (e) {
          errors.data_inicio = errors.data_inicio || 'Formato de data inválido.';
          errors.data_fim = errors.data_fim || 'Formato de data inválido.';
          if (Object.keys(errors).length > 0) return errors;
      }

      // **MODIFICADO:** Comparar com a data/hora atual no fuso horário LOCAL
      const nowLocal = new Date(); // Data/hora atual local
      // Opcional: Comparar com alguns segundos de margem
      const nowWithMargin = new Date(nowLocal.getTime() - 5000); // 5 segundos atrás

      // 1. Validar se as datas são futuras (comparando timestamps locais)
      if (startDate && startDate.getTime() <= nowWithMargin.getTime()) {
           errors.data_inicio = 'Data e hora de início devem ser futuras.';
      }
       if (endDate && endDate.getTime() <= nowWithMargin.getTime()) {
           errors.data_fim = 'Data e hora de fim devem ser futuras.';
       }

      // 2. Validar se data_inicio é anterior a data_fim (comparando timestamps locais)
       if (startDate && endDate && startDate.getTime() >= endDate.getTime()) {
           errors.data_fim = 'Data e hora de fim devem ser posteriores à data de início.';
       }

      return errors; // Retorna o objeto de erros
  };

  // Função para validar disponibilidade (chamada API REAL)
  const validateAvailability = useCallback(async (): Promise<{[key: string]: string | undefined}> => {
      const errors: {[key: string]: string | undefined} = {};

      // Só validar disponibilidade se ambiente_id, data_inicio e data_fim estiverem preenchidos
      if (!formData.ambiente_id || !formData.data_inicio || !formData.data_fim) {
          return {}; // Sem erros se campos não preenchidos
      }

      // Re-validar datas para garantir que são válidas ANTES de chamar a API
      // (Esta validação usa new Date() localmente)
      const dateValidationErrors = validateDates(); // <--- Chama a validação local de datas
      if (Object.keys(dateValidationErrors).length > 0) {
           // Se validateDates encontrou erros (formato inválido, no passado, fim antes de início),
           // ele já definiu formErrors. Não precisamos adicionar aqui, apenas retornar vazio
           // para não bloquear a exibição dos erros de data já definidos.
           return {}; // Retorna sem checar disponibilidade se as datas são inválidas localmente
      }

      setValidatingAvailability(true); // Inicia loading da validação
      try {
           console.log("Chamando backend para verificar disponibilidade...");

           // **CORREÇÃO:** Converter as strings de data/hora locais (sem fuso)
           // para objetos Date (interpretados localmente) e depois para strings ISO 8601 em UTC.
           const startDateLocal = new Date(formData.data_inicio); // Parse no fuso local
           const endDateLocal = new Date(formData.data_fim);     // Parse no fuso local

           // Converter para string ISO 8601 em UTC (com 'Z'). toISOString() faz isso.
           const startDateUtcIso = startDateLocal.toISOString(); // <--- USA toISOString()
           const endDateUtcIso = endDateLocal.toISOString();     // <--- USA toISOString()

           console.log(`Verificando de ${startDateUtcIso} a ${endDateUtcIso} para ambiente ${formData.ambiente_id}.`);


           // Chamar o NOVO endpoint backend GET /reservas/check-availability
           const response = await api.get('/reservas/check-availability', {
               params: {
                  ambiente_id: formData.ambiente_id,
                  data_inicio: startDateUtcIso, // <--- Enviar string ISO 8601 EM UTC
                  data_fim: endDateUtcIso,      // <--- Enviar string ISO 8601 EM UTC
                  reserva_id: reservaId ? parseInt(reservaId, 10) : undefined, // Passa ID como number ou undefined
               }
           });

           // Se a requisição GET retornar 200 OK, está disponível.
           // Se retornar 409 Conflict, o catch será acionado.

           console.log("Verificação de disponibilidade retornou sucesso (200 OK).");

           return {}; // Retorna objeto vazio (sem erros) se a API retornar 200

      } catch (err: any) {
          console.error("Erro na verificação de disponibilidade:", err);
           const availabilityError: {[key: string]: string | undefined} = {};

           // Captura erro 409 especificamente, LANÇA outros erros.
           if (err.response && err.response.status === 409) {
               // Erro de Conflito (Indisponibilidade)
               availabilityError.data_inicio = err.response.data?.detail || 'Ambiente não disponível para este período.'; // Mensagem do backend
               availabilityError.data_fim = availabilityError.data_inicio; // Associar à data_fim
               console.log("Erro 409 de disponibilidade detectado.");
               return availabilityError; // Retorna erros de disponibilidade
           } else if (err.response) {
              // Outro erro de resposta da API (400, 404, 500, etc.)
              // **Lança este erro** para o catch principal de handleSubmit lidar com ele.
              console.error("Erro NÃO 409 na verificação de disponibilidade. Relançando.", err);
              throw err; // <--- RELANÇA O ERRO
           } else {
              // Erro de rede, timeout, etc.
               console.error("Erro de rede ou config na verificação de disponibilidade. Relançando.", err);
              throw err; // <--- RELANÇA O ERRO
           }

      } finally {
          setValidatingAvailability(false); // Finaliza loading da validação
          console.log("validateAvailability finalizado."); // Debug
      }
  }, [formData.ambiente_id, formData.data_inicio, formData.data_fim, reservaId]); // Dependências


  // **MODIFICADO:** Função para validar o formulário no frontend
  const validateForm = (): boolean => {
     const errors: {[key: string]: string | undefined} = {};

     // **CORRIGIDO:** Validação de campos obrigatórios para o formulário de Reserva
     // Validar ambiente_id (deve ser um número selecionado, não vazio ou 0)
     if (!formData.ambiente_id || formData.ambiente_id === '') { // Checa se é 0, null, undefined ou string vazia
         errors.ambiente_id = 'Ambiente é obrigatório.';
     }
     // Validar motivo (não pode ser vazio)
     if (!formData.motivo.trim()) {
          errors.motivo = 'Motivo é obrigatório.';
     }
      // Validação HTML5 'required' também ajuda, mas validação frontend é mais robusta.


     // Validação de datas (usando a função validateDates)
     // Esta função já verifica se data_inicio e data_fim são obrigatórias e válidas.
     const dateErrors = validateDates(); // Chama a função que valida datas
     Object.assign(errors, dateErrors); // Adiciona erros de data ao objeto de erros principal


     setFormErrors(errors); // Define o estado de erros do formulário
     // Retorna true se não houver erros (todos os valores no objeto de erros são undefined).
     return Object.values(errors).every(error => error === undefined);
  };



  // Função para lidar com submissão do formulário (MODIFICADO para usar validateAvailability)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);
    setFormSubmissionError(null); // <--- Limpa erros de submissão anteriores
    setIsSubmittingForm(true);


    // Validação frontend (básica e datas)
    const basicAndDateErrors = validateForm(); // Valida campos obrigatórios e datas
    if (Object.keys(basicAndDateErrors).length > 0) {
        console.log("Validação frontend (básica e datas) falhou.");
        setFormErrors(basicAndDateErrors); // Exibe erros básicos e de datas
        setIsSubmittingForm(false);
        return; // Para a submissão se a validação básica/data falhar
    }
     console.log("Validação frontend (básica e datas) bem-sucedida.");

    // **CORREÇÃO:** CHAMA a validação de disponibilidade INDEPENDENTE AQUI.
    // Esta validação fará uma chamada GET separada para o backend.
    const availabilityErrors = await validateAvailability(); // <--- CHAMA A VALIDAÇÃO DE DISPONIBILIDADE AGORA
    if (Object.keys(availabilityErrors).length > 0) {
         console.log("Verificação de disponibilidade falhou (na função validateAvailability).");
         setFormErrors(prev => ({...prev, ...availabilityErrors})); // Adiciona erros de disponibilidade aos erros do formulário
         setIsSubmittingForm(false);
         return; // Para a submissão se não estiver disponível (erros exibidos pelo setFormErrors)
    }
     console.log("Verificação de disponibilidade bem-sucedida.");


    try {
      // Prepara os dados para enviar (como antes)
      const dataToSend = {
       // Converter '' para null para ambiente_id se for string vazia
       ambiente_id: formData.ambiente_id === '' ? null : formData.ambiente_id, // <--- CORRIGIDO
       data_inicio: formData.data_inicio, // String ISO
       data_fim: formData.data_fim,      // String ISO
       motivo: formData.motivo,
   };

      let response;
      let successMessageText;

      // Lógica POST/PATCH (como antes)
      // **A VALIDAÇÃO DE DISPONIBILIDADE (409) DEVE TER OCORRIDO AGORA (via validateAvailability) ANTES DE CHEGAR AQUI.**
      // O backend AINDA VAI VERIFICAR DISPONIBILIDADE AQUI NOVAMENTE (redundante, mas seguro).
      if (reservaId) {
          // Modo edição
           response = await api.patch(`/reservas/${reservaId}`, dataToSend, { params: { reservar_para_usuario_id: selectedUserId && user?.tipo === 'admin' ? selectedUserId : undefined, } });
          successMessageText = 'Reserva atualizada com sucesso!';

      } else {
          // Modo criação
          const params: any = {};
          if (selectedUserId && user?.tipo === 'admin') {
               params.reservar_para_usuario_id = selectedUserId;
          }
          response = await api.post('/reservas/', dataToSend, { params: params });
          successMessageText = 'Reserva solicitada com sucesso! Aguardando confirmação.';
      }


      // Se a requisição for bem-sucedida (status 2xx)
      if (response.status >= 200 && response.status < 300) {
        console.log('Operação de reserva bem-sucedida:', response.data);
        setSuccessMessage(successMessageText);
        if (!reservaId) {
             setFormData({ ambiente_id: '', data_inicio: '', data_fim: '', motivo: '' });
             setSelectedUserId(null);
        }
        setTimeout(() => { navigate('/minhas-reservas'); }, 1500);

      } else {
         // Axios lança erro para status != 2xx.
      }

    } catch (err: any) {
      console.error('Operação de reserva falhou (no catch do handleSubmit):', err); // Debug

      // **MODIFICADO:** Lida com outros erros específicos do backend (400, 403, etc.).
      // O erro 409 (indisponibilidade) é tratado AGORA no catch de validateAvailability.
      let messageToDisplay = 'Erro desconhecido ao processar reserva.';
      const backendDetail = err.response?.data?.detail;

       if (err.response && err.response.status === 400) {
          // Erro de Validação do Backend (400 Bad Request)
          if (Array.isArray(backendDetail)) {
              // Erro 400 com detail como array de objetos (validação de schema)
              messageToDisplay = backendDetail.map((e: any) => e.msg).join('; '); // Mensagens de validação de schema
          } else if (typeof backendDetail === 'string') {
              messageToDisplay = backendDetail;
          } else {
              messageToDisplay = 'Erro de validação. Verifique os dados enviados.';
          }
       } else if (err.response && err.response.status === 403) {
          // Erro 403 Forbidden
          messageToDisplay = backendDetail || 'Acesso negado.';
       } else if (err.response && err.response.status === 404) {
           // Erro 404 Not Found
           messageToDisplay = backendDetail || 'Recurso não encontrado (Ambiente ou Usuário para reservar).';
       }
        else if (err.response) {
          // Outros erros de resposta da API (500, etc.)
          messageToDisplay = backendDetail || err.response.statusText || `Erro de resposta da API: ${err.response.status}`;
       } else {
          // Erro de rede, timeout, etc.
          messageToDisplay = err.message || 'Erro de rede. Tente novamente.';
       }

      // Exibe o erro de submissão (acima do formulário)
      setFormSubmissionError(messageToDisplay); // Define erro para ser exibido no formulário

    } finally {
      setIsSubmittingForm(false); // Finaliza estado de submissão
    }
  };

  // Renderização condicional (carregamento inicial)
  if (authLoading || loadingInitialData) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando formulário de reserva...</Typography>
        </Box>
    );
  }

  // Erro ao carregar dados iniciais
   if (error) { // Erro geral de carregamento inicial (ex: 403, 500)
       return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
   }


  // Determinar o título da página com base no modo (criação vs edição) (existente)
  const pageTitle = reservaId ? 'Editar Reserva' : 'Solicitar Nova Reserva';
  const submitButtonText = isSubmittingForm || validatingAvailability ? 'Enviando...' : (reservaId ? 'Atualizar Reserva' : 'Solicitar Reserva');
  const isFormDisabled = loadingInitialData || isSubmittingForm || validatingAvailability;


  return (
    <Box sx={{ padding: 3, backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>

      {/* Removido: Título da página fora do Paper */}

      {/* Exibe mensagens de sucesso (acima do formulário) */}
      {successMessage && <Typography color="green" gutterBottom>{successMessage}</Typography>}
      {/* Exibe erro geral de carregamento inicial (acima do formulário) */}
      {error && <Typography color="error" gutterBottom>{error}</Typography>}


      {/* Container para o Formulário (branco, com sombra) */}
      {/* Usar Paper para um visual de card, centralizado horizontalmente */}
      <Paper elevation={6} sx={{ padding: 4, maxWidth: 600, width: '100%', margin: '0 auto', borderRadius: 2 }}>

          {/* **ADICIONADO:** Título do formulário DENTRO do Paper (como antes) */}
           <Typography variant="h5" component="h2" gutterBottom align="center">
              {pageTitle}
           </Typography>


          {/* Exibe erro de submissão geral (se houver) DENTRO do Paper/Formulário */}
          {formSubmissionError && <Typography color="error" gutterBottom component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{formSubmissionError}</Typography>}


          {/* Formulário (modificado para usar Material UI) */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Campo para selecionar usuário (APENAS se admin) */}
            {/* Visível apenas se o usuário logado for admin */}
            {user?.tipo === 'admin' && ( // Mostrar apenas se o usuário logado for admin
                 <Box mb={2}>
                    <FormControl fullWidth required={user?.tipo === 'admin' && !reservaId} disabled={isFormDisabled} error={!!formErrors.selectedUserId}> {/* Requerido se admin em criação */}
                       <InputLabel id="user-select-label">Reservar Para Usuário:</InputLabel>
                       <Select
                         labelId="user-select-label"
                         id="selectedUserId"
                         name="selectedUserId"
                         value={selectedUserId || ''} // Valor do select, usar '' se null
                         label="Reservar Para Usuário"
                         onChange={handleChange}
                         required={user?.tipo === 'admin' && !reservaId} // Requerido se admin em criação
                       >
                         <MenuItem value=""><em>-- Selecione o Usuário --</em></MenuItem>
                         {users.map(userOption => (
                             <MenuItem key={userOption.id} value={userOption.id}>{userOption.nome} ({userOption.email})</MenuItem>
                         ))}
                       </Select>
                       {formErrors.selectedUserId && <Typography variant="caption" color="error">{formErrors.selectedUserId}</Typography>}
                    </FormControl>
                </Box>
            )}


            {/* Campo Ambiente */}
            <Box mb={2}>
              <FormControl fullWidth required error={!!formErrors.ambiente_id} disabled={isFormDisabled}>
                 <InputLabel id="ambiente-select-label">Ambiente:</InputLabel>
                 {/* **CORRIGIDO:** Usar o Select do MUI corretamente com as opções de ambientes */}
                 <Select
                   labelId="ambiente-select-label"
                   id="ambiente_id"
                   name="ambiente_id"
                   value={formData.ambiente_id} // Valor do select (number ou '')
                   label="Ambiente"
                   onChange={handleChange}
                   required
                   disabled={isFormDisabled}
                 >
                   <MenuItem value="">-- Selecione um Ambiente --</MenuItem>
                   {ambientes.map(ambiente => (
                       // O value da opção deve ser o ID numérico
                       <MenuItem key={ambiente.id} value={ambiente.id}>{ambiente.nome} (Cap: {ambiente.capacidade})</MenuItem>
                   ))}
                 </Select>
                  {/* Exibir erro de validação para ambiente_id */}
                  {formErrors.ambiente_id && <Typography variant="caption" color="error">{formErrors.ambiente_id}</Typography>}
              </FormControl>
            </Box>

            {/* Campos de Data/Hora */}
             <Box mb={2}>
                <TextField
                   label="Data e Hora de Início"
                   fullWidth
                   id="data_inicio"
                   name="data_inicio"
                   type="datetime-local"
                   value={formData.data_inicio}
                   onChange={handleChange}
                   required
                   InputLabelProps={{ shrink: true }}
                   disabled={isFormDisabled}
                   error={!!formErrors.data_inicio}
                   helperText={formErrors.data_inicio}
                 />
             </Box>

             <Box mb={2}>
                 <TextField
                    label="Data e Hora de Fim"
                    fullWidth
                    id="data_fim"
                    name="data_fim"
                    type="datetime-local"
                    value={formData.data_fim}
                    onChange={handleChange}
                    required
                    InputLabelProps={{ shrink: true }}
                    disabled={isFormDisabled}
                    error={!!formErrors.data_fim}
                    helperText={formErrors.data_fim}
                  />
             </Box>


            {/* Campo Motivo */}
             <Box mb={2}>
                <TextField
                   label="Motivo da Reserva"
                   fullWidth
                   id="motivo"
                   name="motivo"
                   value={formData.motivo}
                   onChange={handleChange}
                   required
                   multiline
                   rows={3}
                   disabled={isFormDisabled}
                   inputProps={{ maxLength: 100 }}
                   error={!!formErrors.motivo}
                   helperText={formErrors.motivo}
                 />
             </Box>


            {/* Exibe erro de submissão geral (se houver) DENTRO do Paper/Formulário */}
            {formSubmissionError && <Typography color="error" gutterBottom component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{formSubmissionError}</Typography>}


            {/* Botões de Ação (Submit e Cancelar) */}
            <Box mt={3} display="flex" justifyContent="center" gap={2}> {/* **ADICIONADO:** Flexbox para centralizar botões e adicionar gap */}
              <Button
                 type="submit"
                 variant="contained"
                 color="primary"
                 disabled={isFormDisabled}
              >
                {submitButtonText}
              </Button>
              <Button
                 type="button"
                 variant="outlined"
                 onClick={() => navigate('/minhas-reservas')}
                 disabled={isSubmittingForm}
              >
                Cancelar
              </Button>
            </Box>
          </form>

      </Paper> {/* Fim do Paper */}

      {/* Link para voltar (removido ou não necessário se o botão Cancelar redireciona) */}
       {/* <p> ... </p> */}

    </Box>
  );
}

export default RequestReservaPage;