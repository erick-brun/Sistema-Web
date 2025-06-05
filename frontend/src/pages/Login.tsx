// frontend/src/pages/login.tsx

import React, { useState } from 'react';
// Importe a instância axios configurada do seu arquivo api.ts
import api from '../services/api';
// Importe useNavigate para redirecionamento programático (assumindo react-router-dom v6)
import { useNavigate } from 'react-router-dom';

// Opcional: Se estiver usando Material UI, importe componentes aqui
// import { TextField, Button, Typography, Container, Box } from '@mui/material';

interface UsuarioData {
  id: string; // UUID como string no frontend
  nome: string;
  email: string;
  tipo: 'user' | 'admin'; // Use os tipos do Enum do backend
  ativo: boolean;
  data_criacao: string; // Datas geralmente vêm como string ISO 8601
  // Adicione outros campos do UsuarioRead se precisar
}

function LoginPage() {
  // Use state para gerenciar os valores dos inputs de email e senha
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // Use state para gerenciar mensagens de erro
  const [error, setError] = useState<string | null>(null);
  // Hook para navegação programática com react-router-dom v6
  const navigate = useNavigate();


  // Função chamada ao enviar o formulário de login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Previne o comportamento padrão de recarregar a página do formulário

    setError(null); // Limpa quaisquer mensagens de erro anteriores

    try {
      // Cria um objeto FormData para enviar os dados no formato esperado pelo backend OAuth2 Password Flow
      const formData = new FormData();
      formData.append('username', email); // O backend espera 'username' para o email
      formData.append('password', password); // O backend espera 'password' para a senha

      // Envia a requisição POST para o endpoint de login usando a instância axios configurada.
      // O endpoint é /usuarios/login, e a URL base já está configurada em api.ts.
      const response = await api.post('/usuarios/login', formData, {
        // Define o Content-Type para 'application/x-www-form-urlencoded'
        // OAuth2 Password Flow espera este formato para username/password
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Se a requisição for bem-sucedida (status 200 OK), a resposta conterá o token
      const accessToken: string = response.data.access_token;

      // Armazena o token no LocalStorage (ou outra forma de armazenamento seguro).
      // Este token será automaticamente adicionado ao header Authorization pelas requisições futuras via o interceptor no api.ts.
      localStorage.setItem('accessToken', accessToken);

      // Obter e armazenar o ID do usuário logado
      // Fazer uma requisição GET /usuarios/me para obter os dados do usuário logado.
      // Esta requisição usará o token que acabamos de armazenar.
      const userResponse = await api.get('/usuarios/me');
      const userData: UsuarioData = userResponse.data; // Usar a interface UsuarioData
      localStorage.setItem('loggedInUserId', userData.id); // Armazena o ID do usuário
      // Opcional: Armazenar o objeto completo userData também
      // localStorage.setItem('userData', JSON.stringify(userData));


      // Redireciona o usuário para uma página protegida (ex: a página inicial /home).
      console.log('Login bem-sucedido. Redirecionando para /home...');
      navigate('/home'); // Use o hook navigate para ir para a rota /home

    } catch (err: any) { // Use 'any' ou um tipo de erro mais específico se usar um wrapper de erro
      // Lida com erros na requisição API (ex: 401 Unauthorized, 400 Bad Request, 500 Internal Server Error)
      console.error('Login falhou:', err);

      // Extrai e exibe uma mensagem de erro amigável para o usuário.
      // O backend FastAPI, por padrão, envia detalhes em err.response.data.detail para erros HTTP.
      // Ex: para 401, detail: "Credenciais inválidas.". Para 400, detail: "E-mail já está em uso." (no cadastro, mas exemplo)
      const errorMessage = err.response?.data?.detail || 'Erro desconhecido ao fazer login. Tente novamente.';
      setError(errorMessage); // Define a mensagem de erro para ser exibida no componente.
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
        Não tem uma conta? <a href="/cadastro-usuario">Cadastre-se aqui</a> {/* Use Link de react-router-dom para navegação SPA */}
        {/* Ex: <Link to="/cadastro-usuario">Cadastre-se aqui</Link> */}
      </p>
    </div>
  );
}

export default LoginPage;