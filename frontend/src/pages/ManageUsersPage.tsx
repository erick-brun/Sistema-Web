// frontend/src/pages/ManageUsersPage.tsx

import React, { useEffect, useState, useCallback } from 'react'; // Importar useCallback
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// Importar componentes de Material UI para tabelas e layout
import { Box, Typography, CircularProgress, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import theme from '../theme';

// Reutilize a interface UsuarioData (ou UsuarioReadData se usar o nome do backend)
interface UsuarioData { // Baseado no schema UsuarioRead do backend
  id: string; // UUID como string
  nome: string;
  email: string;
  tipo: 'user' | 'admin';
  ativo: boolean;
  data_criacao: string; // ISO 8601 string
  // ... outros campos
}


function ManageUsersPage() { // Renomeado
  // Obtenha o usuário logado do contexto
  const { user, loading: authLoading } = useAuth(); // Para verificar se é admin e evitar auto-gerenciamento

  // State para armazenar a lista de usuários
  const [users, setUsers] = useState<UsuarioData[]>([]);
  // State para lidar com estado de carregamento
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros
  const [error, setError] = useState<string | null>(null);

  // State para controlar qual usuário está sendo modificado (para desabilitar botões)
  const [modifyingUserId, setModifyingUserId] = useState<string | null>(null);


  // useEffect para buscar a lista completa de usuários (requer Admin)
  useEffect(() => {
    const fetchUsers = async () => {
      // Verifica se o usuário logado é admin antes de tentar buscar a lista
      // Esta é uma verificação visual/UX. O backend já protege a rota.
      if (user?.tipo !== 'admin') {
          // Mesmo que a rota seja protegida no backend, exibir uma mensagem no frontend
          // para não admins é uma UX melhor do que apenas um erro 403.
          setError("Acesso negado. Apenas administradores podem gerenciar usuários.");
          setLoading(false);
          return;
      }

      try {
        setLoading(true);
        setError(null);

        // Chama o endpoint GET /usuarios/ (requer Admin).
        // O interceptor do axios adicionará o token.
        const response = await api.get('/usuarios/');

        setUsers(response.data);
        console.log('Lista completa de usuários obtida:', response.data);

      } catch (err: any) {
        console.error('Erro ao obter lista de usuários:', err);
        // O interceptor 401 redireciona para login.
        // Este catch lida com outros erros (ex: 403 - se a verificação acima falhar por algum motivo, ou 500).
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar lista de usuários.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Roda a busca quando o componente é montado OU quando o usuário logado muda (para verificar tipo)
    if (!authLoading) { // Garante que o estado de autenticação inicial foi carregado
      fetchUsers();
    }
  }, [user?.tipo, authLoading, api]); // Depende do tipo de usuário e estado de carregamento do contexto


    // Função para lidar com a ação de Promover Usuário para Admin
    const handlePromote = async (userId: string) => {
        if (!window.confirm(`Tem certeza que deseja promover o usuário ${userId} para administrador?`)) {
            return;
        }

        setModifyingUserId(userId); // Desabilita botões para este usuário


        try {
            // Chama o endpoint PATCH /usuarios/{usuario_id}/promover (requer Admin)
            const response = await api.patch(`/usuarios/${userId}/promover`);
            console.log(`Usuário ${userId} promovido com sucesso:`, response.data);

            // Atualiza a lista local para refletir a mudança (status=admin)
            setUsers(users.map(user => user.id === userId ? { ...user, tipo: 'admin' } : user));

        } catch (err: any) {
            console.error(`Erro ao promover usuário ${userId}:`, err);
            const errorMessage = err.response?.data?.detail || 'Erro ao promover usuário.';
            setError(errorMessage);
            // Lida com 403 (não admin), 404 (usuário não encontrado), 400 (já admin)
        } finally {
            setModifyingUserId(null);
        }
    };

    // Função para lidar com a ação de Rebaixar Admin para Usuário
    const handleDemote = async (userId: string) => {
        if (!window.confirm(`Tem certeza que deseja rebaixar o administrador ${userId} para usuário comum?`)) {
            return;
        }
        // Opcional: Impedir rebaixar a si mesmo aqui no frontend (além do backend)
        if (user?.id === userId) {
            alert("Você não pode rebaixar a si mesmo.");
            return;
        }


        setModifyingUserId(userId); // Desabilita botões


        try {
            // Chama o endpoint PATCH /usuarios/{usuario_id}/rebaixar (requer Admin)
            const response = await api.patch(`/usuarios/${userId}/rebaixar`);
            console.log(`Usuário ${userId} rebaixado com sucesso:`, response.data);

            // Atualiza a lista local para refletir a mudança (status=user)
            setUsers(users.map(user => user.id === userId ? { ...user, tipo: 'user' } : user));

        } catch (err: any) {
            console.error(`Erro ao rebaixar usuário ${userId}:`, err);
            const errorMessage = err.response?.data?.detail || 'Erro ao rebaixar usuário.';
            setError(errorMessage);
            // Lida com 403 (não admin), 404 (usuário não encontrado), 400 (não era admin)
        } finally {
            setModifyingUserId(null);
        }
    };

    // Função para lidar com a ação de Deletar Usuário
    const handleDelete = async (userId: string) => {
    // Opcional: Impedir deletar a si mesmo no frontend (já implementado)
        if (user?.id === userId) {
            alert("Você não pode deletar a si mesmo.");
            return;
        }

    if (!window.confirm(`Tem certeza que deseja deletar o usuário ${userId}? Esta ação é irreversível.`)) {
        return;
    }


    setModifyingUserId(userId); // Desabilita botões


    try {
        // **NOVA LÓGICA:** Verificar se o usuário tem reservas antes de tentar deletar.
        console.log(`Verificando reservas para usuário ${userId} antes de deletar...`); // Debug
        let temReservas = false;
        try {
            // Chama o endpoint GET /usuarios/{usuario_id}/tem-reservas
            // Ele retorna 204 No Content se tiver reservas, 404 Not Found se NÃO tiver.
            await api.get(`/usuarios/${userId}/tem-reservas`);
            // Se chegou aqui sem lançar erro, o status code foi 2xx (ex: 204) -> TEM reservas.
            temReservas = true;
            console.log(`Usuário ${userId} TEM reservas associadas.`); // Debug
        } catch (err: any) {
            // Se o erro for 404 (e apenas 404), significa que NÃO tem reservas.
            if (err.response && err.response.status === 404) {
                temReservas = false; // Não tem reservas
                console.log(`Usuário ${userId} NÃO tem reservas associadas (404).`); // Debug
            } else {
                // Outro erro (ex: 500 ao verificar), lança erro.
                console.error(`Erro inesperado ao verificar reservas para usuário ${userId}:`, err);
                throw err; // Lança o erro para ser capturado pelo catch principal.
            }
        }

        // **Lógica de Deleção Condicional:**
        if (temReservas) {
            // Se o usuário tem reservas, exibe uma mensagem e NÃO chama o endpoint DELETE.
            alert("Não é possível deletar este usuário. Ele ainda possui reservas associadas.");
            console.log(`Deleção de usuário ${userId} impedida por reservas associadas.`); // Debug

        } else {
            // Se NÃO tem reservas, procede com a deleção.
            console.log(`Usuário ${userId} não tem reservas. Procedendo com a deleção...`); // Debug
            // Chama o endpoint DELETE /usuarios/{usuario_id} (requer Admin)
            const response = await api.delete(`/usuarios/${userId}`);
            console.log(`Usuário ${userId} deletado com sucesso:`, response.data);

            // Remove o usuário deletado da lista local
            setUsers(users.filter(user => user.id !== userId));
        }


    } catch (err: any) {
        console.error(`Erro no catch de handleDelete para usuário ${userId}:`, err);

        // Lógica para extrair e exibir mensagem de erro (como aprimorado anteriormente)
        let messageToDisplay = 'Erro desconhecido ao deletar usuário.';
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
        setModifyingUserId(null);
        console.log(`handleDelete finalizado para usuário ${userId}.`); // Debug
    }
    };


  // Renderização condicional (loading/error)
  if (authLoading || loading) { // Usar authLoading e loading
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}> {/* Centralizar spinner */}
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando gerenciamento de usuários...</Typography>
        </Box>
    );
  }

  // Verificar se o usuário logado é admin (proteção frontend/UX)
  if (user?.tipo !== 'admin') {
       return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">Acesso negado. Esta página é apenas para administradores.</Typography></Box>;
  }

  // Exibir erro se houver e não estiver carregando a lista
  if (error && !loading) { // Usar loading
    return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
  }


  return (
    // **ADICIONADO:** Container principal da página (cinza claro)
    <Box sx={{ padding: 3, backgroundColor: theme.palette.background.default }}> {/* Padding e fundo cinza */}
      <Typography variant="h4" component="h1" gutterBottom>Gerenciar Usuários (Admin)</Typography> {/* Título */}

      {/* TODO: Adicionar botão para abrir formulário de CRIAÇÃO (se houver) */}
      {/* Ex: <Button variant="contained" onClick={handleOpenCreateForm}>Novo Usuário</Button> */}


      {/* Exibir a lista de usuários */}
      {users.length > 0 ? (
        // **MODIFICADO:** Usar componentes de Tabela do Material UI
        <TableContainer component={Paper} elevation={2}> {/* Tabela dentro de um Paper com sombra */}
          <Table sx={{ minWidth: 650 }} aria-label="simple table"> {/* minWidth para rolagem horizontal em telas pequenas */}
            <TableHead> {/* Cabeçalho */}
              <TableRow>
                <TableCell>Nome</TableCell> {/* Célula de cabeçalho */}
                <TableCell>Email</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="center">Ativo</TableCell> {/* Alinhar centralizado */}
                <TableCell align="center">Ações</TableCell> {/* Alinhar centralizado */}
              </TableRow>
            </TableHead>
            <TableBody> {/* Corpo da tabela */}
              {users.map((userItem) => ( // userItem para não conflitar com 'user' do contexto
                <TableRow
                  key={userItem.id}
                  // Adicionar efeito hover (opcional)
                   sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f0f0f0' } }} // Remover borda na última linha, efeito hover
                >
                  <TableCell component="th" scope="row">{userItem.nome}</TableCell> {/* Célula com scope="row" para acessibilidade */}
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>{userItem.tipo}</TableCell>
                  <TableCell align="center">{userItem.ativo ? 'Sim' : 'Não'}</TableCell>
                  <TableCell align="center"> {/* Célula para botões de ação, alinhada centralmente */}
                     {/* Ações - Botões Promover, Rebaixar, Deletar (condicionalmente) */}
                     {/* **Restringir ações para o próprio usuário logado e super-admins se houver** */}
                     {/* Os botões são renderizados aqui, a lógica de permissão já está no código */}

                     {/* Botão Promover */}
                     {userItem.tipo !== 'admin' && user?.tipo === 'admin' && user?.id !== userItem.id && (
                        <Button
                            variant="outlined" // Estilo contornado
                            size="small" // Tamanho pequeno
                            onClick={() => handlePromote(userItem.id)}
                            disabled={modifyingUserId === userItem.id}
                        >
                            {modifyingUserId === userItem.id ? 'Promovendo...' : 'Promover'}
                        </Button>
                     )}
                     {' '} {/* Espaço */}

                     {/* Botão Rebaixar */}
                     {userItem.tipo === 'admin' && user?.tipo === 'admin' && user?.id !== userItem.id && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleDemote(userItem.id)}
                            disabled={modifyingUserId === userItem.id}
                        >
                            {modifyingUserId === userItem.id ? 'Rebaixando...' : 'Rebaixar'}
                        </Button>
                     )}
                     {' '} {/* Espaço */}

                     {/* Botão Deletar */}
                      {/* Lógica: Visível se user logado for admin E userItem não for o user logado */}
                       {user?.tipo === 'admin' && user?.id !== userItem.id && (
                          <Button
                              variant="outlined"
                              color="error" // Cor vermelha para erro
                              size="small"
                              onClick={() => handleDelete(userItem.id)}
                              disabled={modifyingUserId === userItem.id}
                          >
                              {modifyingUserId === userItem.id ? 'Deletando...' : 'Deletar'}
                          </Button>
                       )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1">Nenhum usuário encontrado (ou apenas você).</Typography> // Mensagem se lista vazia
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

export default ManageUsersPage;