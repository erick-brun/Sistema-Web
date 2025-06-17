// frontend/src/pages/ManageAmbientesPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // Para verificar se é admin
import { Link, useNavigate } from 'react-router-dom'; // Para navegação

// Importar o componente AmbienteForm (vamos criá-lo em seguida)
import AmbienteForm from '../components/AmbienteForm'; // <--- Importa o componente do formulário

// Opcional: Importar componentes de UI (Material UI TextField, Button, Select, Checkbox, FormControlLabel, Typography, Box)
import { Button } from '@mui/material'; // Importando Button para o botão "Novo Ambiente"


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


  // Renderização condicional (estado de carregamento inicial do contexto OU da lista de ambientes)
  if (authLoading || loading) {
    return <div>Carregando gerenciamento de ambientes...</div>;
  }

  // Verificar se o usuário logado é admin (proteção frontend/UX)
  if (user?.tipo !== 'admin') {
       return <div>Acesso negado. Esta página é apenas para administradores.</div>;
  }

  // Exibir erro se houver e não estiver carregando
  if (error && !loading) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }


  return (
    <div>
      <h1>Gerenciar Ambientes (Admin)</h1>

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
          // **ADICIONADO:** Usando o componente AmbienteForm
          <AmbienteForm
              // Passa initialData (dados do ambiente sendo editado, null para criação)
              initialData={ambienteBeingEdited}
              // Passa a função de submissão (que lida com a chamada API)
              onSubmit={handleSubmitForm}
              // Passa a função para fechar o formulário (botão Cancelar)
              onCancel={handleCloseForm}
              // Passa estados de submissão e erro para o formulário controlar seus botões/mensagens
              isSubmitting={isSubmittingForm}
              submitError={formSubmissionError}
          />
      )}


      {/* Exibir a lista de ambientes (visível se formulário NÃO estiver aberto) */}
      {/* Renderizar apenas se a lista NÃO estiver carregando E o formulário NÃO estiver aberto */}
      {!loading && !isFormOpen && (
           ambientes.length > 0 ? (
             <table> {/* Usar uma tabela */}
               <thead>
                 <tr>
                   <th>ID</th>
                   <th>Nome</th>
                   <th>Capacidade</th>
                   <th>Tipo</th>
                   <th>Ativo</th>
                   <th>Comodidades</th>
                   <th>Ações</th> {/* Coluna para botões */}
                 </tr>
               </thead>
               <tbody>
                 {ambientes.map(ambiente => (
                   <tr key={ambiente.id}>
                     <td>{ambiente.id}</td>
                     <td>{ambiente.nome}</td>
                     <td>{ambiente.capacidade}</td>
                     <td>{ambiente.tipo_ambiente}</td>
                     <td>{ambiente.ativo ? 'Sim' : 'Não'}</td>
                     <td>
                        {/* Exibir Comodidades */}
                        {ambiente.tv ? 'TV ' : ''}
                        {ambiente.projetor ? 'Projetor ' : ''}
                        {ambiente.ar_condicionado ? 'Ar Cond. ' : ''}
                     </td>
                     <td>
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
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           ) : (
             <p>Nenhum ambiente encontrado.</p> // Mensagem se lista vazia
           )
      )}


      {/* TODO: Adicionar funcionalidade de paginação ou filtros aqui */}
       <p></p>
       {/* Link para voltar */}
        <p><Link to="/home">Voltar para o início</Link></p>
    </div>
  );
}

export default ManageAmbientesPage;