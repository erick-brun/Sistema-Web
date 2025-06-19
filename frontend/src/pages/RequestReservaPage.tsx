// frontend/src/pages/RequestReservaPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importar componentes de UI (Material UI)
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Typography, Box, CircularProgress } from '@mui/material';

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


            // **Carregar Lista de Ambientes (sempre)**
            const ambientesResponse = await api.get('/ambientes/', { params: { ativo: true } });
            setAmbientes(ambientesResponse.data);
            console.log('Lista de ambientes para solicitação obtida:', ambientesResponse.data);

            // **Carregar Lista de Usuários (APENAS se admin)**
            let fetchedUsers: UsuarioData[] = [];
            if (user?.tipo === 'admin') {
                 console.log("Carregando lista de usuários para admin...");
                 const usersResponse = await api.get('/usuarios/'); // GET /usuarios/ requer Admin
                 fetchedUsers = usersResponse.data;
                 setUsers(fetchedUsers);
                 console.log('Lista de usuários (Admin) obtida:', fetchedUsers);
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

                // **Pré-selecionar o usuário associado à reserva (no modo edição)**
                 if (user?.tipo === 'admin') {
                     setSelectedUserId(reservaData.usuario.id);
                 }


            } else {
                // Modo criação: Formulário vazio.
                console.log("Modo criação: Formulário vazio.");
                // Opcional: Pré-selecionar o primeiro usuário na lista para admin na criação?
                 if (user?.tipo === 'admin' && fetchedUsers.length > 0) {
                     setSelectedUserId(fetchedUsers[0].id);
                     console.log(`Admin pré-selecionado usuário ${fetchedUsers[0].id} na criação.`); // Debug
                 }
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

  // **NOVA LÓGICA:** Função para validar disponibilidade (chamada API)
  // Usa useCallback para memorizar a função se ela tiver muitas dependências e for chamada em useEffect
  const validateAvailability = useCallback(async (): Promise<{[key: string]: string | undefined}> => {
      const errors: {[key: string]: string | undefined} = {};

      // Só validar disponibilidade se ambiente_id, data_inicio e data_fim estiverem preenchidos E não tiver erros de data
      if (!formData.ambiente_id || !formData.data_inicio || !formData.data_fim) {
          // A validação básica de campos obrigatórios já lida com isso.
          return {};
      }

      // Re-validar datas para garantir que são válidas ANTES de checar disponibilidade
      const dateValidationErrors = validateDates();
      if (Object.keys(dateValidationErrors).length > 0) {
           setFormErrors(prev => ({...prev, ...dateValidationErrors})); // Adiciona erros de data
           return {}; // Não checa disponibilidade se as datas são inválidas
      }

      setValidatingAvailability(true); // Inicia loading da validação
      try {
           // Chamar o endpoint backend que verifica disponibilidade
           // Backend já tem a função crud.verificar_disponibilidade_ambiente
           // Precisamos de um endpoint backend que apenas use esta função e retorne status.
           // Podemos criar um novo endpoint GET /reservas/verificar-disponibilidade
           // ou talvez adaptar a rota de criação para incluir uma checagem 'pré-voo'.
           // A forma mais comum é um endpoint GET que verifica.

           // TODO: Criar um endpoint backend GET /reservas/check-availability
           // Endpoint GET /reservas/check-availability
           // Parâmetros de Query: ambiente_id, data_inicio, data_fim, reserva_id (opcional para edição)
           // Retorna: 200 OK se disponível, 409 Conflict se NÃO disponível.
           // Ex: await api.get('/reservas/check-availability', { params: { ambiente_id, data_inicio, data_fim, reserva_id } });

           console.log("Chamando backend para verificar disponibilidade..."); // Debug

           // **Implementação Provisória:** Reutilizar a lógica do endpoint de criação no backend
           // para checar disponibilidade, mas sem salvar. Isso exigiria modificar o backend.
           // **Alternativa:** Chamar o endpoint de criação, mas adicionar um parâmetro dummy
           // que diga ao backend para apenas validar e não salvar. (Não recomendado).
           // **Melhor:** Criar um endpoint GET dedicado no backend (como sugerido).

           // **Simulando Chamada de Verificação de Disponibilidade (Até criar endpoint backend):**
           // Esta parte é um PLACEHOLDER!
           // Você precisará de um endpoint backend real para isso.
           // Por enquanto, vamos apenas SIMULAR que a verificação acontece e passa.
           // Remover este placeholder quando o endpoint backend for criado.
           // console.log("Simulando verificação de disponibilidade (sem chamar backend)...");
           // await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay
           // const isAvailable = true; // Simula que está disponível

           // **Usando o endpoint de criação para CHECAR (com resalvas):**
           // O endpoint POST /reservas/ já tem a checagem de disponibilidade.
           // Ao tentar criar, se não disponível, ele retorna 409.
           // Podemos confiar nesta checagem apenas no SUBMIT final.
           // Mas a validação PRÉVIA no frontend seria melhor.

           // **Realmente PRECISA de um endpoint backend para check de disponibilidade.**
           // Se o endpoint existe:
           const response = await api.get('/reservas/check-availability', {
               params: {
                  ambiente_id: formData.ambiente_id,
                  data_inicio: formData.data_inicio, // Strings ISO
                  data_fim: formData.data_fim,
                  // Para edição, passar o ID da reserva que está sendo editada para excluir da checagem
                  reserva_id: reservaId ? parseInt(reservaId, 10) : undefined, // Converte string para int ou undefined
               }
           });

           // Se a requisição GET retornar 200 OK, está disponível.
           // Se retornar 409 Conflict, NÃO está disponível (backend lida com isso).
           // Outros erros serão capturados pelo catch.

           console.log("Verificação de disponibilidade retornou sucesso."); // Debug

           return {}; // Sem erros de disponibilidade

      } catch (err: any) {
          console.error("Erro na verificação de disponibilidade:", err);
           const availabilityError: {[key: string]: string | undefined} = {};
           // Se o backend retornou 409 Conflict, o erro.response.data.detail terá a mensagem.
           if (err.response && err.response.status === 409) {
               availabilityError.data_inicio = err.response.data.detail || 'Ambiente não disponível para este período.'; // Exibe mensagem de indisponibilidade
               availabilityError.data_fim = err.response.data.inicio; // Exibe mensagem no campo data_fim também (opcional)
           } else {
              // Outro erro inesperado na API de verificação
              setError('Erro inesperado ao verificar disponibilidade.'); // Exibe erro geral
           }
          return availabilityError; // Retorna erros de disponibilidade
      } finally {
          setValidatingAvailability(false); // Finaliza loading da validação
      }
  }, [formData.ambiente_id, formData.data_inicio, formData.data_fim, reservaId]); // Dependências: campos do formulário e reservaId


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



  // Função para lidar com submissão do formulário (adaptada para validação)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);
    setFormSubmissionError(null);
    setIsSubmittingForm(true);


    // **ADICIONADO:** Validação frontend antes de submeter
    if (!validateForm()) {
        console.log("Validação frontend falhou.");
        setIsSubmittingForm(false);
        return; // Para a submissão se a validação falhar
    }
     console.log("Validação frontend básica bem-sucedida.");

    // **ADICIONADO:** Validação de disponibilidade (chamada API) ANTES de submeter
    // Esta validação é crucial. Ela pode retornar erros (409).
    const availabilityErrors = await validateAvailability(); // <--- CHAMA A VALIDAÇÃO DE DISPONIBILIDADE
    if (Object.keys(availabilityErrors).length > 0) {
         console.log("Verificação de disponibilidade falhou."); // Debug
         setFormErrors(prev => ({...prev, ...availabilityErrors})); // Adiciona erros de disponibilidade
         setIsSubmittingForm(false);
         return; // Para a submissão se não estiver disponível
    }
     console.log("Verificação de disponibilidade bem-sucedida.");


    try {
      // Prepara os dados para enviar (como antes)
      const dataToSend = {
          ambiente_id: formData.ambiente_id,
          data_inicio: formData.data_inicio,
          data_fim: formData.data_fim,
          motivo: formData.motivo,
      };

      let response;
      let successMessageText;

      // Lógica POST/PATCH (como antes)
      if (reservaId) {
          // Modo edição
          response = await api.patch(`/reservas/${reservaId}`, dataToSend, {
              params: { // Opcional: adicionar o query param de usuário selecionado na edição também?
                 // Se admin, e reservando para outro, talvez precise enviar aqui também?
                 // backend espera 'reservar_para_usuario_id'
                 reservar_para_usuario_id: selectedUserId && user?.tipo === 'admin' ? selectedUserId : undefined,
              }
          });
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
      console.error('Operação de reserva falhou (na submissão principal API):', err);

      // Lida com erros específicos do backend
      const errorMessage = err.response?.data?.detail || 'Erro desconhecido ao processar reserva.';
      setError(errorMessage); // Este erro é para a página pai (se o formulário for modal)
      setFormSubmissionError(errorMessage); // <--- Define erro para ser exibido no formulário (usado aqui)

    } finally {
      setIsSubmittingForm(false); // Finaliza estado de submissão
    }
  };


  // Determinar o título da página com base no modo (criação vs edição)
  const pageTitle = reservaId ? 'Editar Reserva' : 'Solicitar Nova Reserva';
  const submitButtonText = isSubmittingForm || validatingAvailability ? 'Enviando...' : (reservaId ? 'Atualizar Reserva' : 'Solicitar Reserva'); // Texto dinâmico incluindo validação de disponibilidade

  // Determinar se o formulário está desabilitado (carregando dados iniciais ou submetendo ou validando)
  const isFormDisabled = loadingInitialData || isSubmittingForm || validatingAvailability;


  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>{pageTitle}</Typography>

      {successMessage && <Typography color="green" gutterBottom>{successMessage}</Typography>}
      {error && <Typography color="error" gutterBottom>{error}</Typography>} {/* Este erro é para carregamento inicial */}


      {/* Formulário */}
      <form onSubmit={handleSubmit}>

        {/* **ADICIONADO:** Campo para selecionar usuário (APENAS se admin) */}
        {user?.tipo === 'admin' && ( // Mostrar apenas se o usuário logado for admin
             <Box mb={2}>
                <FormControl fullWidth required={user?.tipo === 'admin' && !reservaId} disabled={isFormDisabled} error={!!formErrors.selectedUserId}> {/* Requerido se admin em criação */}
                   <InputLabel id="user-select-label">Reservar Para Usuário:</InputLabel>
                   <Select
                     labelId="user-select-label"
                     id="selectedUserId"
                     name="selectedUserId"
                     value={selectedUserId || ''}
                     label="Reservar Para Usuário"
                     onChange={handleChange}
                     required={user?.tipo === 'admin' && !reservaId} // Requerido se admin em criação
                   >
                     <MenuItem value=""><em>-- Selecione o Usuário --</em></MenuItem>
                     {users.map(userOption => (
                         <MenuItem key={userOption.id} value={userOption.id}>{userOption.nome} ({userOption.email})</MenuItem>
                     ))}
                   </Select>
                   {formErrors.selectedUserId && <Typography variant="caption" color="error">{formErrors.selectedUserId}</Typography>} {/* Exibe erro de validação */}
                </FormControl>
             </Box>
        )}


        {/* Campo Ambiente */}
        <Box mb={2}>
          <FormControl fullWidth required error={!!formErrors.ambiente_id} disabled={isFormDisabled}>
             <InputLabel id="ambiente-select-label">Ambiente:</InputLabel>
             <Select
               labelId="ambiente-select-label"
               id="ambiente_id"
               name="ambiente_id"
               value={formData.ambiente_id}
               label="Ambiente"
               onChange={handleChange}
               required
               disabled={isFormDisabled}
             >
               <MenuItem value="">-- Selecione um Ambiente --</MenuItem>
               {ambientes.map(ambiente => (
                 <MenuItem key={ambiente.id} value={ambiente.id}>{ambiente.nome} (Cap: {ambiente.capacidade})</MenuItem>
               ))}
             </Select>
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
               inputProps={{ maxLength: 100 }} // Limite de caracteres no frontend
               error={!!formErrors.motivo}
               helperText={formErrors.motivo}
             />
         </Box>

        {/* Exibe erro de submissão aqui, DENTRO do formulário */}
        {formSubmissionError && <Typography color="error" gutterBottom>{formSubmissionError}</Typography>}


        {/* Botões de Ação (Submit e Cancelar) */}
        <Box mt={3}>
          <Button
             type="submit"
             variant="contained"
             color="primary"
             disabled={isFormDisabled} // Desabilita se carregando ou submetendo ou validando
          >
            {submitButtonText}
          </Button>
          {' '}
          <Button
             type="button"
             variant="outlined"
             onClick={() => navigate('/minhas-reservas')} // Botão Cancelar redireciona para minhas reservas
             disabled={isSubmittingForm} // Desabilita apenas se submetendo (para não interromper API call)
          >
            Cancelar
          </Button>
        </Box>
      </form>


      {/* Link para voltar (se o formulário for modal, este link não seria necessário aqui) */}
       <p>
         {/* <Link to="/minhas-reservas">Ver minhas reservas</Link> | <Link to="/home">Voltar para o início</Link> */}
       </p>

    </Box>
  );
}

export default RequestReservaPage;