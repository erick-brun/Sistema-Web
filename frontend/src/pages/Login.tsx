// frontend/src/pages/Login.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // <--- Importe useAuth


function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth(); // <--- Obtenha login e isAuthenticated do contexto

  // Se já autenticado, redirecionar (útil se o usuário tentar ir para /login manualmente estando logado)
  useEffect(() => {
     if (isAuthenticated) {
         navigate('/home');
     }
  }, [isAuthenticated, navigate]); // Roda quando isAuthenticated ou navigate mudam


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Formulário submetido. Prevenindo default."); // Debug
    setError(null);

    try {
      // Chame a função login do contexto.
      // A lógica de API call, storage e setAuthState está DENTRO do contexto.
      console.log("Chamando função login do contexto..."); // Debug
      await login(email, password); // <--- Chame a função login do contexto
      console.log("Função login do contexto retornou (sucesso)."); // Debug (Se chegar aqui, login do contexto não lançou erro)

      // Após login bem-sucedido (handled pelo contexto e useEffect acima),
      // o estado isAuthenticated no contexto será true,
      // e o useEffect acima cuidará do redirecionamento.
      // Não precisa mais do navigate('/home') aqui.

    } catch (err: any) {
       // O contexto login propaga o erro. Lide com ele aqui para exibir a mensagem.
       console.error('Login falhou (capturado em Login.tsx):', err); // Debug
       console.error('Login falhou:', err);
       const errorMessage = err.response?.data?.detail || 'Erro desconhecido ao fazer login. Tente novamente.';
       setError(errorMessage);
    }
  };


  return (
    <div>
      <h2>Página de Login</h2>
      {/* Formulário de login */}
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email:</label> {/* Use htmlFor para acessibilidade */}
          <input
            type="email"
            id="email" // Adicione ID correspondente ao htmlFor
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Atualiza o estado ao digitar
            required // Torna o campo obrigatório no HTML
          />
        </div>
        <div>
          <label htmlFor="password">Senha:</label> {/* Use htmlFor */}
          <input
            type="password"
            id="password" // Adicione ID
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* Botão para enviar o formulário */}
        <button type="submit">Entrar</button>

        {/* Exibe a mensagem de erro se houver */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>

      {/* Opcional: Link para a página de cadastro */}
      <p>
        Não tem uma conta? <Link to="/cadastro-usuario">Cadastre-se aqui</Link> {/* Use Link */}
      </p>
    </div>
  );
}

export default LoginPage;