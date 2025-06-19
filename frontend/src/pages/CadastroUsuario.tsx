// frontend/src/pages/CadastroUsuario.tsx

import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
// Importe useAuth se o cadastro for restrito a admin (geralmente cadastro é público)
// import { useAuth } from '../context/AuthContext';

// Importar componentes de Material UI
import { TextField, Button, Typography, Container, Box, Paper, CircularProgress } from '@mui/material';
import theme from '../theme';


function CadastroUsuarioPage() { // Renomeado
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  // Opcional: Obter estado de autenticação/loading se o cadastro precisar verificar algo
  // const { isAuthenticated, loading: authLoading } = useAuth();


  // **ADICIONADO:** Estado para desabilitar formulário durante a submissão
   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);


  // Função chamada ao enviar o formulário de cadastro (modificada para usar Material UI e estado de submissão)
  const handleCadastro = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true); // Inicia submissão

    // Validação básica no frontend (opcional, mas boa prática)
    if (!nome || !email || !password) {
      setError('Por favor, preencha todos os campos.');
      setIsSubmitting(false);
      return;
    }
    // Você pode adicionar validação básica de formato de email ou comprimento de senha aqui também.


    try {
      const response = await api.post('/usuarios/', {
        nome,
        email,
        senha: password,
      });

      // Se a requisição for bem-sucedida (status 201 Created)
      if (response.status === 201) {
        console.log('Cadastro bem-sucedido:', response.data);
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
         // Teoricamente, o axios lança erro para status != 2xx
         setError('Erro inesperado no cadastro.');
      }

    } catch (err: any) {
      console.error('Cadastro falhou:', err);

      const errorMessage = err.response?.data?.detail || 'Erro desconhecido ao cadastrar. Tente novamente.';
      setError(errorMessage);
    } finally {
        setIsSubmitting(false); // Finaliza submissão
    }
  };


  // Opcional: Renderização condicional enquanto o contexto de autenticação está carregando (se usar useAuth)
  // if (authLoading) { ... }


  return (
    // **ADICIONADO:** Container principal da página Cadastro (cinza claro)
    // Usar flexbox para centralizar o conteúdo
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center', // Centralizar horizontalmente
            alignItems: 'center', // Centralizar verticalmente
            minHeight: '100vh', // Ocupar pelo menos 100% da altura da viewport
            padding: 3, // Padding geral
            backgroundColor: theme.palette.background.default, // <--- Fundo cinza claro do tema
        }}
    >
      {/* **ADICIONADO:** Container para o Formulário (branco, com sombra) */}
      {/* Usar Paper para um visual de card */}
      <Paper elevation={6} sx={{ padding: 4, minWidth: 300, maxWidth: 400, width: '100%', borderRadius: 2 }}> {/* Padding interno, largura, cantos arredondados */}

          <Typography variant="h5" component="h1" gutterBottom align="center">
             Cadastro de Usuário
          </Typography>

          {/* Exibe mensagens de erro ou sucesso (acima do formulário) */}
          {error && <Typography color="error" align="center" gutterBottom>{error}</Typography>} {/* Usar Typography para erro */}
          {successMessage && <Typography color="success" align="center" gutterBottom>{successMessage}</Typography>} {/* Usar Typography para sucesso */}

          {/* Formulário de cadastro (modificado para usar Material UI) */}
          <form onSubmit={handleCadastro} noValidate> {/* noValidate desabilita validação HTML5 padrão */}
             {/* Campo Nome */}
              <TextField
                 label="Nome Completo"
                 type="text"
                 fullWidth // Ocupa a largura total
                 margin="normal" // Adiciona margem padrão (top/bottom)
                 value={nome}
                 onChange={(e) => setNome(e.target.value)}
                 required // Torna o campo obrigatório
                 disabled={isSubmitting} // Desabilita durante a submissão
                />

             {/* Campo Email */}
              <TextField
                 label="Email"
                 type="email"
                 fullWidth
                 margin="normal"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 disabled={isSubmitting}
                />

             {/* Campo Senha */}
              <TextField
                 label="Senha"
                 type="password"
                 fullWidth
                 margin="normal"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
                 disabled={isSubmitting}
                />

             {/* Botão para enviar o formulário */}
             <Button
                 type="submit"
                 variant="contained" // Estilo preenchido
                 color="primary" // Cor primária (azul do tema)
                 fullWidth // Ocupa a largura total
                 size="large" // Botão maior
                 disabled={isSubmitting} // Desabilita durante a submissão
                 sx={{ mt: 3 }} // Adiciona margem superior (mt = margin-top)
             >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Cadastrar'} {/* Texto ou spinner */}
             </Button>

          </form>

          {/* Link para a página de login */}
          <Box mt={2} textAlign="center"> {/* mt = margin-top, centraliza texto */}
              <Typography variant="body2">
                Já tem conta? <Link to="/login">Faça login aqui</Link> {/* Usar Link de react-router-dom */}
              </Typography>
          </Box>

      </Paper> {/* Fim do Paper */}
    </Box> // Fim do Box container principal
  );
}

export default CadastroUsuarioPage;