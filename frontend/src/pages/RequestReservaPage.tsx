// frontend/src/pages/RequestReservaPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
// Importe useParams para obter o parâmetro de ID da URL
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- Importar useAuth

// Importar componentes de UI (se usar Material UI)
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Typography, Box, CircularProgress } from '@mui/material'; // Adicionado CircularProgress

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


  // State para lidar com estado de carregamento (ambientes, RESERVA EXISTENTE, usuários)
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true); // Carregando dados iniciais
  // **CORRIGIDO:** State para o estado de SUBMISSÃO
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false); // <--- Renomeado e declarado


  // State para lidar com mensagens de erro e sucesso
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // **CORRIGIDO:** State para erro de submissão (se a API retornar erro)
  const [formSubmissionError, setFormSubmissionError] = useState<string | null>(null); // <--- Renomeado e declarado


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


  // TODO: Função para validar o formulário no frontend (como antes)
  // const validateForm = (): boolean => { ... }; // Validar campos do formData e talvez selectedUserId


  // Função para lidar com submissão do formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);
    setFormSubmissionError(null); // <--- Limpa erros de submissão anteriores (passados via props)
    setIsSubmittingForm(true); // Inicia estado de submissão

    // TODO: Adicionar validação frontend antes de submeter (usando validateForm)
    // if (!validateForm()) { ... setSubmittingForm(false); return; }


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

      // Lógica para escolher entre POST (criar) e PATCH (editar)
      if (reservaId) {
          // Modo edição: Chamar endpoint PATCH para atualizar a reserva
          console.log(`Modo edição: Enviando atualização para reserva ${reservaId}:`, dataToSend);
          // PATCH /reservas/{reserva_id} requer autenticação (qualquer logado), backend lida com permissão (dono/admin)
          response = await api.patch(`/reservas/${reservaId}`, dataToSend); // Envia JSON
          successMessageText = 'Reserva atualizada com sucesso!';

      } else {
          // Modo criação: Chamar endpoint POST para criar nova reserva
          console.log("Modo criação: Enviando solicitação de nova reserva:", dataToSend);
          // POST /reservas/ requer autenticação.
          // Adicionar o query parameter 'reservar_para_usuario_id' SE um usuário foi selecionado por um admin.
          // A rota backend POST /reservas/ espera 'reservar_para_usuario_id' como QUERY PARAM.
          const params: any = {}; // Usar 'any' para params por enquanto
          if (selectedUserId && user?.tipo === 'admin') { // Só adiciona o parâmetro se admin selecionou um usuário E ele é admin logado
               params.reservar_para_usuario_id = selectedUserId;
               console.log(`Admin está criando reserva para usuário ID: ${selectedUserId}`);
          } else if (!selectedUserId && user?.tipo === 'admin'){ // Admin não selecionou, cria para si mesmo (o backend usa o ID logado)
                console.log(`Admin está criando reserva para si mesmo ID: ${user.id}`);
               // Não adicionar o query param, o backend usa o ID do usuário logado.
          } else {
               // Não admin, o backend usará o ID do usuário logado por padrão.
               console.log(`Usuário comum está criando reserva para si mesmo ID: ${user?.id}`);
          }


          response = await api.post('/reservas/', dataToSend, { params: params }); // Envia JSON com QUERY PARAM opcional
          successMessageText = 'Reserva solicitada com sucesso! Aguardando confirmação.';
      }


      // Se a requisição for bem-sucedida (status 2xx)
      if (response.status >= 200 && response.status < 300) { // Verifica qualquer status 2xx
        console.log('Operação de reserva bem-sucedida:', response.data);
        setSuccessMessage(successMessageText);
        // Opcional: Limpar o formulário APENAS SE FOR CRIAÇÃO BEM-SUCEDIDA
        if (!reservaId) { // Se não for edição
             setFormData({ ambiente_id: '', data_inicio: '', data_fim: '', motivo: '' });
             setSelectedUserId(null); // Limpa também o usuário selecionado (se admin)
        }
        // Redirecionar para a página de "Minhas Reservas" APÓS SUCESSO (em ambos os modos)
        // Pode adicionar um pequeno delay para o usuário ver a mensagem de sucesso
        setTimeout(() => { navigate('/minhas-reservas'); }, 1500);

      } else {
         // Axios lança erro para status != 2xx. Este else não deve ser alcançado.
      }

    } catch (err: any) {
      console.error('Operação de reserva falhou:', err);

      // Lida com erros específicos do backend (409 Conflict, 403 Forbidden, 400 Bad Request, etc.)
      const errorMessage = err.response?.data?.detail || 'Erro desconhecido ao processar reserva.';
      setError(errorMessage); // Exibe erro
      setFormSubmissionError(errorMessage); // <--- Define erro de submissão para ser exibido no formulário

    } finally {
      setIsSubmittingForm(false); // Finaliza estado de submissão
    }
  };


  // Determinar o título da página com base no modo (criação vs edição)
  const pageTitle = reservaId ? 'Editar Reserva' : 'Solicitar Nova Reserva';
  const submitButtonText = isSubmittingForm ? 'Enviando...' : (reservaId ? 'Atualizar Reserva' : 'Solicitar Reserva');

  // Determinar se o formulário está desabilitado (carregando dados iniciais ou submetendo)
  const isFormDisabled = loadingInitialData || isSubmittingForm; // Usar isSubmittingForm


  // Renderização condicional (estado de carregamento inicial)
  if (authLoading || loadingInitialData) { // Usar loadingInitialData
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando formulário de reserva...</Typography>
        </Box>
    );
  }

  // Nota: Erros ao carregar a reserva existente (404, etc.) são tratados pelo redirecionamento no useEffect.
  // Erros na submissão são exibidos acima do formulário.


  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>{pageTitle}</Typography>

      {successMessage && <Typography color="green" gutterBottom>{successMessage}</Typography>}
      {error && <Typography color="error" gutterBottom>{error}</Typography>} {/* Este erro é para carregamento inicial */}
       {/* Erro de submissão é exibido DENTRO do formulário */}


      {/* Formulário */}
      {/* Passar props de estado para o formulário se AmbienteForm for um componente separado */}
      {/* <AmbienteForm initialData={...} onSubmit={...} onCancel={...} isSubmitting={isSubmittingForm} submitError={formSubmissionError} /> */}
      {/* No nosso caso, o formulário está AQUI. */}


      <form onSubmit={handleSubmit}>

        {/* **ADICIONADO:** Campo para selecionar usuário (APENAS se admin) */}
        {user?.tipo === 'admin' && ( // Mostrar apenas se o usuário logado for admin
             <Box mb={2}>
                <FormControl fullWidth disabled={isFormDisabled}> {/* Desabilitar se carregando ou submetendo */}
                   <InputLabel id="user-select-label">Reservar Para Usuário:</InputLabel>
                   <Select
                     labelId="user-select-label"
                     id="selectedUserId" // ID para o input
                     name="selectedUserId" // Name para o handleChange
                     value={selectedUserId || ''} // Value do select, usar '' se null
                     label="Reservar Para Usuário"
                     onChange={handleChange} // Usa o mesmo handleChange
                     // Opcional: error={!!formErrors.selectedUserId}
                     // helperText={formErrors.selectedUserId}
                   >
                     {/* Opcional: Opção para reservar para si mesmo (se admin)? */}
                     {/* <MenuItem value={user.id}>Eu ({user.nome})</MenuItem> */}
                     <MenuItem value="">-- Selecione o Usuário --</MenuItem> {/* Opção vazia */}
                     {users.map(userOption => (
                         // O value deve ser o ID do usuário (string UUID)
                         <MenuItem key={userOption.id} value={userOption.id}>{userOption.nome} ({userOption.email})</MenuItem>
                     ))}
                   </Select>
                </FormControl>
             </Box>
        )}


        {/* Campo Ambiente */}
        <Box mb={2}>
          <FormControl fullWidth required disabled={isFormDisabled}> {/* Adicionado required e disabled */}
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
              {/* TODO: Adicionar mensagem de erro frontend se usar validação */}
          </FormControl>
        </Box>

        {/* Campos de Data/Hora (usar TextField com type="datetime-local") */}
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
             />
              {/* TODO: Adicionar mensagem de erro frontend se usar validação */}
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
              />
              {/* TODO: Adicionar mensagem de erro frontend se usar validação */}
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
             />
             {/* TODO: Adicionar mensagem de erro frontend se usar validação */}
         </Box>

        {/* **ADICIONADO:** Exibe erro de submissão aqui, DENTRO do formulário */}
        {formSubmissionError && <Typography color="error" gutterBottom>{formSubmissionError}</Typography>}


        {/* Botões de Ação (Submit e Cancelar) */}
        <Box mt={3}>
          <Button
             type="submit"
             variant="contained"
             color="primary"
             disabled={isFormDisabled} // Desabilita se carregando ou submetendo
          >
            {submitButtonText}
          </Button>
          {' '}
          <Button
             type="button"
             variant="outlined"
             onClick={() => navigate('/minhas-reservas')} // <--- Botão Cancelar redireciona para minhas reservas
             disabled={isSubmittingForm} // Desabilita apenas se submetendo
          >
            Cancelar
          </Button>
        </Box>
      </form>


      {/* Link para voltar (mantido opcionalmente) */}
       <p>
         {/* <Link to="/minhas-reservas">Ver minhas reservas</Link> | <Link to="/home">Voltar para o início</Link> */}
       </p>

    </Box>
  );
}

export default RequestReservaPage;