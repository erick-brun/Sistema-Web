// frontend/src/pages/ManageAmbientesPage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// Importar componentes de Material UI para tabelas, formulários e layout
import { Box, Typography, CircularProgress, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material'; // Adicionado Table components
// Importar componentes de formulário (se usar para o formulário inline ou modal)
import { TextField, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, useTheme } from '@mui/material';
import theme from '../theme';

// Importar o componente AmbienteForm (se usar)
import AmbienteForm from '../components/AmbienteForm'; // <--- Importa o componente do formulário


// Reutilize a interface AmbienteData (ou AmbienteReadData)
export interface AmbienteData { // Exportar a interface para ser usada em AmbienteForm
  id: number;
  nome: string;
  capacidade: number;
  descricao: string;
  tipo_ambiente: string; // String para o Enum
  ativo: boolean;
  tv: boolean;
  projetor: boolean;
  ar_condicionado: boolean;
  // ... outros campos
}

// Interface para os dados do formulário de Ambiente (para criação/edição)
export interface AmbienteFormData { // Exportar a interface para ser usada em AmbienteForm
  nome: string;
  capacidade: number | ''; // Pode começar vazio no formulário
  descricao: string;
  tipo_ambiente: string; // String para o Enum no formulário
  ativo: boolean;
  tv: boolean;
  projetor: boolean;
  ar_condicionado: boolean;
}


function ManageAmbientesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const theme = useTheme();

  // State para armazenar a lista de ambientes
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  // State para lidar com estado de carregamento (lista e ações)
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Estado para mensagem de sucesso

  const [modifyingAmbienteId, setModifyingAmbienteId] = useState<number | null>(null);

  // Estado para controlar a visibilidade do formulário de criação/edição
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  // Estado para armazenar os dados do ambiente sendo editado (se for o caso)
  // Se null, é modo criação. Se preenchido (AmbienteData), é modo edição.
  const [ambienteBeingEdited, setAmbienteBeingEdited] = useState<AmbienteData | null>(null);

  // Estado para lidar com o estado de submissão do formulário (passado para AmbienteForm)
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);
  // Estado para lidar com erro de submissão do formulário (passado para AmbienteForm)
  const [formSubmissionError, setFormSubmissionError] = useState<string | null>(null);


  // useEffect para buscar a lista completa de ambientes (requer Admin)
  // Adaptado para recarregar a lista após uma submissão bem-sucedida do formulário
  const fetchAmbientes = async () => {
     // Verifica se o usuário logado é admin antes de tentar buscar a lista
     if (user?.tipo !== 'admin') {
         setError("Acesso negado. Esta página é apenas para administradores.");
         setLoading(false);
         return;
     }

     try {
       // Não define loading = true aqui, pois o caller (useEffect ou handleSubmitForm) gerencia isso.
       setError(null); // Limpa erros

       const response = await api.get('/ambientes/');

       setAmbientes(response.data);
       console.log('Lista completa de ambientes (Admin) obtida:', response.data);

     } catch (err: any) {
       console.error('Erro ao obter lista de ambientes (Admin):', err);
       const errorMessage = err.response?.data?.detail || 'Erro ao carregar lista de ambientes.';
       setError(errorMessage);
     } finally {
       // loading = false é gerenciado pelo caller
     }
  };

  // useEffect para carregar a lista na montagem inicial ou quando o tipo de usuário muda
  useEffect(() => {
     if (!authLoading) { // Garante que o estado de autenticação inicial foi carregado
        setLoading(true); // Inicia o loading da lista
        fetchAmbientes().finally(() => setLoading(false)); // Busca a lista e finaliza o loading
     }
  }, [user?.tipo, authLoading]); // Depende do tipo de usuário e estado de carregamento do contexto


  // Função para abrir o formulário para CRIAÇÃO
  const handleOpenCreateForm = () => {
     setAmbienteBeingEdited(null); // Define como null para indicar modo criação
     setIsFormOpen(true); // Abre o formulário
     setError(null); // Limpa erros da página pai
     setSuccessMessage(null); // Limpa mensagens de sucesso da página pai
     setFormSubmissionError(null); // Limpa erros de submissão anteriores
  };

  // Função para abrir o formulário para EDIÇÃO
  const handleOpenEditForm = (ambiente: AmbienteData) => {
     setAmbienteBeingEdited(ambiente); // Define o ambiente sendo editado
     setIsFormOpen(true); // Abre o formulário
     setError(null); // Limpa erros da página pai
     setSuccessMessage(null); // Limpa mensagens de sucesso
     setFormSubmissionError(null); // Limpa erros de submissão anteriores
  };

  // Função para fechar o formulário
  const handleCloseForm = () => {
     setIsFormOpen(false);
     setAmbienteBeingEdited(null);
     // Opcional: Limpar mensagens de erro/sucesso relacionadas ao formulário APÓS fechar
     setFormSubmissionError(null);
     // setError(null); // Cuidado: não limpar error global se ele for de carregamento da lista
     // setSuccessMessage(null); // Cuidado
  };

  // **NOVA LÓGICA:** Função para lidar com a submissão do formulário (passada para AmbienteForm)
  const handleSubmitForm = async (formData: AmbienteFormData, ambienteId?: number) => {
     console.log("Submissão do formulário recebida:", formData, ambienteId);

     setIsSubmittingForm(true); // Inicia o estado de submissão do formulário
     setFormSubmissionError(null); // Limpa erros de submissão anteriores

     try {
         let response;
         let successMessageText;

         // Determinar se é criação ou edição
         if (ambienteId) {
             // Modo edição: Chamar endpoint PATCH para atualizar a ambiente
             console.log(`Enviando atualização para ambiente ${ambienteId}:`, formData);
             // PATCH /ambientes/{ambiente_id} requer Admin. O backend lida com 404.
             response = await api.patch(`/ambientes/${ambienteId}`, formData); // Envia JSON
             successMessageText = `Ambiente "${formData.nome}" atualizado com sucesso!`;
         } else {
             // Modo criação: Chamar endpoint POST para criar novo ambiente
             console.log("Enviando criação de novo ambiente:", formData);
             // POST /ambientes/ requer Admin.
             response = await api.post('/ambientes/', formData); // Envia JSON
             successMessageText = `Ambiente "${formData.nome}" criado com sucesso!`;
         }

         console.log("Resposta da API:", response);

         // Se a API retornar sucesso (axios lida com 2xx)
         // Recarregar a lista de ambientes na página pai para refletir a mudança/criação
         await fetchAmbientes(); // Aguarda a recarga da lista

         setSuccessMessage(successMessageText); // Exibe mensagem de sucesso
         // Opcional: Adicionar um pequeno delay antes de fechar para o usuário ver a mensagem
         setTimeout(() => {
             handleCloseForm(); // Fecha o formulário após sucesso
         }, 1000); // Fecha após 1 segundo


     } catch (err: any) {
          console.error("Erro na submissão do formulário Ambiente:", err);
          const errorMessage = err.response?.data?.detail || 'Erro ao salvar ambiente.';
          setFormSubmissionError(errorMessage); // Exibe erro no formulário via props
     } finally {
         setIsSubmittingForm(false); // Finaliza o estado de submissão
     }
  };


  // Função para lidar com a ação de Deletar Ambiente (existente)
  const handleDelete = async (ambienteId: number) => {
      setSuccessMessage(null); // Limpa mensagens de sucesso no início da ação
      setError(null); // Limpa erros globais (embora o erro da deleção vá para o catch)

     if (!window.confirm(`Tem certeza que deseja deletar o ambiente com ID ${ambienteId}? Esta ação é irreversível.`)) {
         return;
     }

     setModifyingAmbienteId(ambienteId); // Desabilita botões para este ambiente


     try {
        // NOVO: Verificar se o ambiente tem reservas antes de tentar deletar.
        let temReservas = false;
        try {
            // GET /ambientes/{ambiente_id}/tem-reservas retorna 204 se tem, 404 se não tem. Requer Admin.
            await api.get(`/ambientes/${ambienteId}/tem-reservas`);
            temReservas = true; // Se não lançou erro, tem reservas.
        } catch (err: any) {
             if (err.response && err.response.status === 404) {
                 temReservas = false; // Não tem reservas (404 Not Found)
             } else {
                 // Outro erro inesperado na verificação (ex: 500, 403 se a rota não exigir admin corretamente)
                 // Lança o erro para ser capturado pelo catch principal da deleção.
                 throw err;
             }
        }

        if (temReservas) {
            // Se o ambiente tem reservas, informa ao usuário e para a deleção.
            alert("Não é possível deletar este ambiente. Ele ainda possui reservas associadas.");
        } else {
            // Se NÃO tem reservas, procede com a deleção.
            console.log(`Deletando ambiente ${ambienteId}...`);
            // DELETE /ambientes/{ambiente_id} requer Admin.
            const response = await api.delete(`/ambientes/${ambienteId}`);
            console.log(`Ambiente ${ambienteId} deletado com sucesso:`, response.data);

            // Remove o ambiente deletado da lista local para atualização imediata da UI
            setAmbientes(ambientes.filter(ambiente => ambiente.id !== ambienteId));

            setSuccessMessage(`Ambiente ${ambienteId} deletado com sucesso!`); // Mensagem de sucesso
        }

     } catch (err: any) {
        console.error(`Erro no catch de handleDelete para ambiente ${ambienteId}:`, err);
        // Lógica para extrair e exibir mensagem de erro (como aprimorado anteriormente)
        let messageToDisplay = 'Erro desconhecido ao deletar ambiente.';
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
        setError(messageToDisplay);

     } finally {
        setModifyingAmbienteId(null); // Finaliza estado de modificação
     }
  };


  // Renderização condicional (loading/error)
  if (authLoading || loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando gerenciamento de ambientes...</Typography>
        </Box>
    );
  }

  // Verificar se o usuário logado é admin (proteção frontend/UX)
  if (user?.tipo !== 'admin') {
       return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">Acesso negado. Esta página é apenas para administradores.</Typography></Box>;
  }


  if (error && !loading) {
    return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
  }


  return (
    // **ADICIONADO:** Container principal da página (cinza claro)
    <Box sx={{ padding: 3, backgroundColor: theme.palette.background.default }}> {/* Padding e fundo cinza */}
      <Typography variant="h4" component="h1" gutterBottom>Gerenciar Ambientes (Admin)</Typography> {/* Título */}

      {/* Botão para abrir formulário de CRIAÇÃO */}
      {/* Renderizar apenas se o formulário NÃO estiver aberto */}
      {/* Usar Button do Material UI */}
      {!isFormOpen && (
           <Button
               variant="contained"
               color="primary"
               onClick={handleOpenCreateForm}
               disabled={loading} // Desabilitar se a lista estiver carregando
           >
               Novo Ambiente
           </Button>
      )}

      {/* Renderizar o formulário de criação/edição (visível se isFormOpen é true) */}
      {isFormOpen && (
          // **ADICIONADO:** Usando o componente AmbienteForm (com estados e handlers passados)
          // O componente AmbienteForm contém a estrutura do formulário e sua lógica interna
          <AmbienteForm
              initialData={ambienteBeingEdited} // Passa dados para edição (null para criação)
              onSubmit={handleSubmitForm} // Passa a função de submissão
              onCancel={handleCloseForm} // Passa a função de cancelamento
              isSubmitting={isSubmittingForm} // Passa estado de submissão
              submitError={formSubmissionError} // Passa erro de submissão
          />
      )}


      {/* Exibir a lista de ambientes (visível se formulário NÃO estiver aberto) */}
      {/* Renderizar apenas se a lista NÃO estiver carregando E o formulário NÃO estiver aberto */}
      {!loading && !isFormOpen && (
           ambientes.length > 0 ? (
             // **MODIFICADO:** Usar componentes de Tabela do Material UI
             <TableContainer component={Paper} elevation={2} sx={{ marginTop: 2 }}> {/* Tabela dentro de um Paper com sombra, espaço acima */}
               <Table sx={{ minWidth: 650 }} aria-label="manage ambientes table"> {/* minWidth para rolagem horizontal */}
                 <TableHead> {/* Cabeçalho */}
                   <TableRow>
                     <TableCell>ID</TableCell> {/* Célula de cabeçalho */}
                     <TableCell>Nome</TableCell>
                     <TableCell>Capacidade</TableCell>
                     <TableCell>Tipo</TableCell>
                     <TableCell align="center">Ativo</TableCell> {/* Alinhar centralizado */}
                     <TableCell>Comodidades</TableCell>
                     <TableCell align="center">Ações</TableCell> {/* Alinhar centralizado */}
                   </TableRow>
                 </TableHead>
                 <TableBody> {/* Corpo da tabela */}
                   {ambientes.map((ambiente) => (
                     <TableRow
                       key={ambiente.id}
                       // Adicionar efeito hover (opcional)
                        sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: theme.palette.action.hover } }} // Remover borda na última linha, efeito hover
                     >
                       <TableCell component="th" scope="row">{ambiente.id}</TableCell> {/* Célula com scope="row" para acessibilidade */}
                       <TableCell>{ambiente.nome}</TableCell>
                       <TableCell>{ambiente.capacidade}</TableCell>
                       <TableCell>{ambiente.tipo_ambiente}</TableCell>
                       <TableCell align="center">{ambiente.ativo ? 'Sim' : 'Não'}</TableCell>
                       <TableCell>
                          {/* Exibir Comodidades */}
                          <Typography variant="body2">
                             {ambiente.tv ? 'TV ' : ''}
                             {ambiente.projetor ? 'Projetor ' : ''}
                             {ambiente.ar_condicionado ? 'Ar Cond. ' : ''}
                          </Typography>
                       </TableCell>
                       <TableCell align="center"> {/* Célula para botões de ação, alinhada centralmente */}
                          {/* Botões Editar e Deletar */}
                          {/* Renderizar apenas se o formulário NÃO estiver aberto */}
                          {!isFormOpen && (
                             // Botão Editar (chama handleOpenEditForm)
                             <Button
                                 variant="outlined" // Estilo contornado
                                 size="small" // Tamanho pequeno
                                 onClick={() => handleOpenEditForm(ambiente)}
                                 disabled={modifyingAmbienteId !== null} // Desabilitar se outro item estiver sendo modificado
                             >
                                 Editar
                             </Button>
                          )}
                          {' '} {/* Espaço */}

                          {/* Botão Deletar (chama handleDelete, desabilitado durante modificação ou se formulário aberto) */}
                          <Button
                              variant="outlined"
                              color="error" // Cor vermelha para erro
                              size="small"
                              onClick={() => handleDelete(ambiente.id)}
                              disabled={modifyingAmbienteId === ambiente.id || isFormOpen || modifyingAmbienteId !== null} // Desabilitar se este item sendo modificado, se formulário aberto, ou se outro item sendo modificado
                          >
                              {modifyingAmbienteId === ambiente.id ? 'Deletando...' : 'Deletar'} {/* Texto dinâmico */}
                          </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </TableContainer>
           ) : (
             <Typography variant="body1">Nenhum ambiente encontrado.</Typography> // Mensagem se lista vazia
           )
      )}


      {/* TODO: Adicionar funcionalidade de paginação ou filtros aqui */}
       <Box mt={3}>
          {/* Links ou botões de paginação/filtros */}
       </Box>


       <Box mt={3}>
         {/* Link para voltar (já no Layout) */}
         {/* <Link to="/home">Voltar para o início</Link> */}
       </Box>
    </Box>
  );
}

export default ManageAmbientesPage;