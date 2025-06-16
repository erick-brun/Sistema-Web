// frontend/src/context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../services/api'; // Importe a instância axios configurada
import { useNavigate } from 'react-router-dom'; // Para redirecionamento (pode ser usado no provedor)

// Reutilize interfaces para os dados do usuário
interface UsuarioData { // Pode usar a mesma interface definida em Login/Home
  id: string;
  nome: string;
  email: string;
  tipo: 'user' | 'admin';
  ativo: boolean;
  data_criacao: string;
  // ... outros campos
}

// Interface para o estado do contexto de autenticação
interface AuthState {
  isAuthenticated: boolean; // Indica se o usuário está autenticado
  user: UsuarioData | null; // Dados do usuário logado (se autenticado)
  token: string | null; // O token JWT (se autenticado)
  loading: boolean; // Estado de carregamento (ex: ao verificar autenticação inicial)
}

// Interface para as ações (funções) que o contexto fornecerá
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>; // Função de login
  logout: () => void; // Função de logout
  // Opcional: signup (se quiser mover a lógica de cadastro para cá)
}

// Estado inicial do contexto
const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true, // Começa como true para carregar estado inicial
};

// Crie o contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Crie o Provedor de autenticação
interface AuthProviderProps {
  children: ReactNode; // Componentes filhos que serão envolvidos pelo provedor
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  // TODO: Lógica para tentar carregar token/usuário do localStorage na montagem inicial
  useEffect(() => {
    const loadAuthFromStorage = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUserId = localStorage.getItem('loggedInUserId'); // Se armazenou o ID
      // Opcional: const storedUserData = localStorage.getItem('userData');

      if (storedToken && storedUserId) {
        // Se um token existe, verificar se ele ainda é válido (opcional mas recomendado)
        // E obter os dados completos do usuário se não estiverem armazenados
        try {
          // Reutilizar a chamada GET /usuarios/me para validar o token E obter os dados do usuário
          // O interceptor do axios adicionará storedToken automaticamente aqui
          const userResponse = await api.get('/usuarios/me');
          const userData: UsuarioData = userResponse.data;

          setAuthState({
            isAuthenticated: true,
            user: userData,
            token: storedToken,
            loading: false,
          });
          console.log("Sessão restaurada para usuário:", userData.email);

        } catch (error) {
          // Token inválido ou expirado (401) ou outro erro ao obter dados
          console.error("Falha ao restaurar sessão:", error);
          // Limpa storage e define estado como não autenticado
          localStorage.removeItem('accessToken');
          localStorage.removeItem('loggedInUserId');
          // Opcional: localStorage.removeItem('userData');
          setAuthState({ isAuthenticated: false, user: null, token: null, loading: false });
        }
      } else {
        // Sem token no storage, não autenticado
        setAuthState({ isAuthenticated: false, user: null, token: null, loading: false });
      }
    };

    loadAuthFromStorage();
  }, []); // Executa apenas uma vez na montagem

  // TODO: Implementar a função de login (movida de Login.tsx)
  const login = async (email: string, password: string): Promise<void> => {
    console.log("Contexto: Função login chamada com email:", email); // Debug
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/usuarios/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      console.log("Contexto: api.post('/usuarios/login') retornou sucesso."); // Debug
      const accessToken: string = response.data.access_token;
      console.log("Contexto: Access token obtido."); // Debug

      // **CORREÇÃO:** Armazenar o token NO LOCALSTORAGE AQUI, ANTES da próxima chamada API.
      localStorage.setItem('accessToken', accessToken); // <--- MOVIDO PARA CIMA!
      console.log("Contexto: Access token armazenado em LocalStorage."); // Debug

      // Agora, a próxima requisição GET /usuarios/me terá o token no header,
      // pois o interceptor de requisição o encontrará no LocalStorage.
      const userResponse = await api.get('/usuarios/me');
      console.log("Contexto: api.get('/usuarios/me') retornou sucesso."); // Debug

      const userData: UsuarioData = userResponse.data;
      console.log("Contexto: Dados do usuário logado obtidos:", userData.email); // Debug

      // Armazenar o ID do usuário (se necessário, o objeto completo já está no estado do contexto)
      localStorage.setItem('loggedInUserId', userData.id); // Mantenha se outros componentes precisarem apenas do ID

      // **CRUCIAL:** Atualizar o estado do contexto APÓS TODAS as APIs calls terem sido bem-sucedidas.
      setAuthState({
        isAuthenticated: true,
        user: userData, // <--- Armazena os dados do usuário aqui
        token: accessToken, // <--- Armazena o token aqui também (redundante se já no storage, mas bom para o contexto)
        loading: false, // Já autenticado
      });
      console.log("Contexto: setAuthState chamado com isAuthenticated: true."); // Debug

      console.log("Contexto: Função login concluída com sucesso."); // Debug

      // TODO: Redirecionar após login (pode ser feito aqui ou no componente Login.tsx)
      // Ex: const navigate = useNavigate(); navigate('/home'); // Precisa de useNavigate
      // Ou use window.location.href = '/home';

    } catch (error) {
      console.error("Falha no login:", error);
      // Limpa tokens e dados no storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('loggedInUserId');
      // Opcional: localStorage.removeItem('userData');
      setAuthState({ isAuthenticated: false, user: null, token: null, loading: false });
      console.log("Contexto: setAuthState chamado para limpar autenticação."); // Debug
      // TODO: Propagar o erro para o componente Login.tsx exibir a mensagem.
      throw error; // Propaga o erro para o componente Login.tsx lidar com ele.
    }
  };

  // TODO: Implementar a função de logout (movida de Home.tsx)
  const logout = () => {
    console.log("Realizando logout...");
    // Limpa tokens e dados no storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('loggedInUserId');
    // Opcional: localStorage.removeItem('userData');
    // Opcional: Chamar endpoint de logout no backend para invalidar token/sessão
    // api.post('/usuarios/logout'); // Se existir no backend

    // Atualiza o estado do contexto
    setAuthState({ isAuthenticated: false, user: null, token: null, loading: false });

    // TODO: Redirecionar para a página de login após logout
    // Ex: const navigate = useNavigate(); navigate('/login');
    // Ou use window.location.href = '/login';
  };

  // Fornece o estado de autenticação e as ações (login/logout) para os componentes filhos.
  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {/* Renderiza os componentes filhos */}
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para usar o contexto de autenticação facilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};