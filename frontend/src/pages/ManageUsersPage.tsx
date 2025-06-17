// frontend/src/pages/ManageUsersPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api';
// Importe useAuth para obter o usuário logado (para verificar se é admin e talvez evitar auto-gerenciamento)
import { useAuth } from '../context/AuthContext';
// Importe Link ou useNavigate se precisar de navegação
import { Link, useNavigate } from 'react-router-dom';

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


  // Renderização condicional baseada no estado de carregamento do Contexto OU da lista de usuários
  if (authLoading || loading) {
    return <div>Carregando gerenciamento de usuários...</div>;
  }

  // Verificar se o usuário logado é admin para renderizar o conteúdo principal
  // A rota já é protegida por ProtectedRoute e AuthContext para login,
  // mas precisamos verificar o TIPO do usuário para esta página específica de ADMIN.
  if (user?.tipo !== 'admin') {
       // Esta mensagem deve aparecer se o usuário não for admin.
       // A dependência get_current_admin na rota backend também retornaria 403.
       // Esta checagem frontend aprimora a UX.
       return <div>Acesso negado. Esta página é apenas para administradores.</div>;
  }


  // Se não estiver carregando e o usuário for admin, exibe a lista de usuários.
  if (error && !loading) { // Exibe erro se houver e não estiver carregando (após a tentativa de carregar a lista)
    return <div style={{ color: 'red' }}>{error}</div>;
  }


  return (
    <div>
      <h1>Gerenciar Usuários (Admin)</h1>

      {/* Opcional: Botão para criar novo usuário? (Você já tem página de cadastro) */}
      {/* <Link to="/cadastro-usuario">Cadastrar Novo Usuário</Link> */}

      {/* Exibir a lista de usuários */}
      {users.length > 0 ? (
        <table> {/* Usar uma tabela para exibir usuários */}
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Ativo</th>
              <th>Ações</th> {/* Coluna para botões */}
            </tr>
          </thead>
          <tbody>
            {users.map(userItem => ( // Renomeado para userItem para não conflitar com 'user' do contexto
              <tr key={userItem.id}>
                <td>{userItem.nome}</td>
                <td>{userItem.email}</td>
                <td>{userItem.tipo}</td>
                <td>{userItem.ativo ? 'Sim' : 'Não'}</td>
                <td>
                   {/* Ações - Botões Promover, Rebaixar, Deletar */}
                   {/* **Restringir ações para o próprio usuário logado e super-admins se houver** */}

                   {/* Botão Promover: Visível se userItem não for admin E user logado for admin */}
                   {userItem.tipo !== 'admin' && user?.tipo === 'admin' && user?.id !== userItem.id && (
                      <button
                          onClick={() => handlePromote(userItem.id)}
                          disabled={modifyingUserId === userItem.id} // Desabilita durante modificação
                      >
                          {modifyingUserId === userItem.id ? 'Promovendo...' : 'Promover'}
                      </button>
                   )}
                   {' '} {/* Espaço */}

                   {/* Botão Rebaixar: Visível se userItem for admin E user logado for admin E userItem não for o user logado */}
                   {userItem.tipo === 'admin' && user?.tipo === 'admin' && user?.id !== userItem.id && (
                      <button
                          onClick={() => handleDemote(userItem.id)}
                          disabled={modifyingUserId === userItem.id}
                      >
                          {modifyingUserId === userItem.id ? 'Rebaixando...' : 'Rebaixar'}
                      </button>
                   )}
                   {' '} {/* Espaço */}

                   {/* Botão Deletar: Visível se user logado for admin E userItem não for o user logado */}
                    {/* Nota: Lógica para super-admins ou outros usuários "protegidos" deve ser adicionada */}
                    {user?.tipo === 'admin' && user?.id !== userItem.id && (
                       <button
                           onClick={() => handleDelete(userItem.id)}
                           disabled={modifyingUserId === userItem.id}
                       >
                           {modifyingUserId === userItem.id ? 'Deletando...' : 'Deletar'}
                       </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        // Mensagem se não houver usuários (ou apenas o usuário logado)
        <p>Nenhum usuário encontrado (ou apenas você).</p>
      )}

      {/* TODO: Adicionar funcionalidade de paginação ou filtros aqui */}
       <p></p>
       {/* Link para voltar */}
        <p><Link to="/home">Voltar para o início</Link></p>
    </div>
  );
}

export default ManageUsersPage;