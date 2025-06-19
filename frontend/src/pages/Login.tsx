// frontend/src/pages/Login.tsx

import React, { useState, useEffect } from 'react'; // Importar useEffect
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importar componentes de Material UI
import { TextField, Button, Typography, Container, Box, Paper, CircularProgress } from '@mui/material'; // Adicionado Paper e CircularProgress
import theme from '../theme';

// Reutilize ou defina interfaces (já definidas)
// interface UsuarioData { ... }


function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth(); // Adicionado authLoading para feedback de carregamento do contexto

  // **ADICIONADO:** Estado para desabilitar formulário durante a submissão
   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);


  // useEffect para redirecionar se já autenticado (existente)
  useEffect(() => {
     // Espera o AuthContext terminar de carregar o estado inicial
     if (!authLoading && isAuthenticated) {
         navigate('/home');
     }
  }, [isAuthenticated, navigate, authLoading]); // Depende de authLoading agora


  // Função chamada ao enviar o formulário de login (modificada para usar Material UI e estado de submissão)
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setIsSubmitting(true); // Inicia submissão

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      // Chamar a função login do contexto
      // A lógica de API call, storage e setAuthState está DENTRO do contexto login.
      await login(email, password);

      // Após login bem-sucedido (handled pelo contexto e useEffect acima),
      // o estado isAuthenticated no contexto será true,
      // e o useEffect acima cuidará do redirecionamento.

    } catch (err: any) {
       // O contexto login propaga o erro. Lide com ele aqui para exibir a mensagem.
       console.error('Login falhou (capturado em LoginPage):', err);
       const errorMessage = err.response?.data?.detail || 'Erro desconhecido ao fazer login. Tente novamente.';
       setError(errorMessage); // Define a mensagem de erro para ser exibida no componente.
    } finally {
        setIsSubmitting(false); // Finaliza submissão
    }
  };


  // Renderização condicional enquanto o contexto de autenticação está carregando
  if (authLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}> {/* Centraliza verticalmente */}
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Verificando autenticação...</Typography>
        </Box>
    );
  }

  // Se já autenticado (após carregar o contexto), o useEffect já redireciona.
  // Então, se chegarmos aqui e !authLoading for true, mas !isAuthenticated for true,
  // o formulário de login será renderizado.

  return (
    // **ADICIONADO:** Container principal da página Login (cinza claro)
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
             Login
          </Typography>

          {/* Exibe a mensagem de erro se houver (acima do formulário) */}
          {error && <Typography color="error" align="center" gutterBottom>{error}</Typography>} {/* Usar Typography para erro */}

          {/* Formulário de login (modificado para usar Material UI) */}
          <form onSubmit={handleLogin} noValidate> {/* noValidate desabilita validação HTML5 padrão */}
             {/* Campo Email */}
              <TextField
                 label="Email"
                 type="email"
                 fullWidth // Ocupa a largura total do container
                 margin="normal" // Adiciona margem padrão (top/bottom)
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required // Torna o campo obrigatório
                 disabled={isSubmitting} // Desabilita durante a submissão
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
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Entrar'} {/* Texto ou spinner */}
             </Button>

          </form>

          {/* Opcional: Link para a página de cadastro */}
          <Box mt={2} textAlign="center"> {/* mt = margin-top, centraliza texto */}
              <Typography variant="body2">
                Não tem uma conta? <Link to="/cadastro-usuario">Cadastre-se aqui</Link> {/* Usar Link de react-router-dom */}
              </Typography>
          </Box>

      </Paper> {/* Fim do Paper */}
    </Box> // Fim do Box container principal
  );
}

export default LoginPage;