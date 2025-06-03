// frontend/src/pages/CadastroUsuario.tsx

import React, { useState } from 'react';
// Importe a instância axios configurada
import api from '../services/api';
// Importe useNavigate ou Link para navegação após o cadastro
import { useNavigate, Link } from 'react-router-dom'; // Use Link para o link de volta ao login

// Opcional: Se estiver usando Material UI, importe componentes aqui
// import { TextField, Button, Typography, Container, Box } from '@mui/material';


function CadastroUsuarioPage() { // Renomeado para maior clareza
  // Use state para gerenciar os valores dos inputs
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  // Use state para gerenciar mensagens de erro e sucesso
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Mensagem de sucesso

  // Hook para navegação programática (opcional, pode redirecionar para login após sucesso)
  const navigate = useNavigate();


  // Função chamada ao enviar o formulário de cadastro
  const handleCadastro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Previne o comportamento padrão de recarregar a página

    setError(null); // Limpa mensagens de erro anteriores
    setSuccessMessage(null); // Limpa mensagens de sucesso anteriores

    // Validação básica no frontend (opcional, mas boa prática)
    if (!nome || !email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    // Você pode adicionar validação básica de formato de email ou comprimento de senha aqui também.

    try {
      // Envia a requisição POST para o endpoint de cadastro.
      // O backend espera um corpo JSON com nome, email e senha (schema UsuarioCreate).
      const response = await api.post('/usuarios/', {
        nome,
        email,
        senha: password, // Nome do campo esperado pelo backend (senha em texto puro no schema de entrada)
      });

      // Se a requisição for bem-sucedida (status 201 Created)
      if (response.status === 201) {
        console.log('Cadastro bem-sucedido:', response.data);
        // Exibe uma mensagem de sucesso
        setSuccessMessage('Usuário cadastrado com sucesso! Agora você pode fazer login.');
        // Opcional: Limpar o formulário após sucesso
        setNome('');
        setEmail('');
        setPassword('');
        // Opcional: Redirecionar para a página de login após alguns segundos
        // setTimeout(() => {
        //   navigate('/login');
        // }, 3000); // Redireciona após 3 segundos

      } else {
         // Teoricamente, o axios lança erro para status != 2xx, mas uma checagem extra é segura
         setError('Erro inesperado no cadastro.');
      }

    } catch (err: any) {
      // Lida com erros na requisição API (ex: 400 Bad Request - e-mail já em uso, 500 Internal Server Error)
      console.error('Cadastro falhou:', err);

      // Extrai e exibe uma mensagem de erro amigável.
      const errorMessage = err.response?.data?.detail || 'Erro desconhecido ao cadastrar. Tente novamente.';
      setError(errorMessage); // Define a mensagem de erro para ser exibida.
    }
  };


  return (
    <div>
      <h2>Página de Cadastro de Usuário</h2>
      {/* Formulário de cadastro */}
      <form onSubmit={handleCadastro}>
        <div>
          <label htmlFor="nome">Nome Completo:</label>
          <input
            type="text"
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Senha:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {/* Botão para enviar o formulário */}
        <button type="submit">Cadastrar</button>

        {/* Exibe mensagens de erro ou sucesso */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      </form>

      {/* Link para a página de login */}
      <p>
        Já tem conta? <Link to="/login">Faça login aqui</Link> {/* Use o componente Link do react-router-dom */}
      </p>
    </div>
  );
}

export default CadastroUsuarioPage;