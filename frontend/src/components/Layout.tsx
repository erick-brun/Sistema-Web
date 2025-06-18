// frontend/src/components/Layout.tsx

import React, { ReactNode } from 'react';
// Importe Link para links de navegação
import { Link } from 'react-router-dom';
// Importe useAuth para obter o usuário logado e a função logout
import { useAuth } from '../context/AuthContext';

// Opcional: Importar componentes de UI para o layout (ex: AppBar, Toolbar, Button, Box, Typography)
import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';


// Interface para as props do componente Layout
interface LayoutProps {
  children: ReactNode; // O conteúdo da página a ser envolvido
}

// Componente de Layout com Barra de Navegação
const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Obtenha o usuário logado e a função logout do contexto de autenticação
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();

  // Lógica de logout (chama a função do contexto)
  const handleLogout = () => {
    logout();
    // O redirecionamento após logout é tratado pelo AuthContext/ProtectedRoute
  };

  // Renderizar null ou um spinner se o contexto de autenticação ainda estiver carregando
  if (authLoading) {
    return null; // Ou um spinner global se preferir que a página inteira mostre loading
  }


  return (
    <Box sx={{ flexGrow: 1 }}> {/* Box para o container principal, usando flexGrow se usar Material UI */}
      {/* AppBar (Barra Superior) */}
      <AppBar position="static"> {/* position="static" ou "fixed" se quiser fixo */}
        <Toolbar> {/* Container dentro do AppBar */}
          {/* Título/Nome da Aplicação */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema de Reservas
          </Typography>

          {/* Links de Navegação */}
          <Box sx={{ display: { xs: 'none', md: 'flex' } }}> {/* Exemplo: Ocultar em telas pequenas, mostrar em telas médias/grandes */}
             {isAuthenticated && ( // Mostrar links APENAS se autenticado
                <>
                   {/* Link para a página inicial */}
                   <Button color="inherit" component={Link} to="/home">Início</Button> {/* Usar Button e Link juntos */}
                   <Button color="inherit" component={Link} to="/ambientes">Ambientes</Button>
                   <Button color="inherit" component={Link} to="/minhas-reservas">Minhas Reservas</Button>
                   <Button color="inherit" component={Link} to="/calendario">Calendário</Button>
                   <Button color="inherit" component={Link} to="/solicitar-reserva">Solicitar Reserva</Button>
                   <Button color="inherit" component={Link} to="/historico-reservas">Meu Histórico</Button> {/* Link para histórico pessoal */}

                   {/* Links de Administração (visíveis APENAS se o usuário for Admin) */}
                   {user?.tipo === 'admin' && (
                       <>
                           <Button color="inherit" component={Link} to="/gerenciar-usuarios">Gerenciar Usuários</Button>
                           <Button color="inherit" component={Link} to="/gerenciar-ambientes">Gerenciar Ambientes</Button>
                           <Button color="inherit" component={Link} to="/gerenciar-reservas">Gerenciar Reservas</Button> {/* Link para gerenciar todas */}
                           <Button color="inherit" component={Link} to="/gerenciar-historico-reservas">Histórico Geral</Button> {/* Link para histórico geral */}
                       </>
                   )}

                   {/* Informações do Usuário Logado (Opcional) */}
                   {/* <Typography variant="body1" color="inherit" sx={{ ml: 2 }}>Olá, {user.nome}!</Typography> */}
                   {/* Botão de Logout */}
                   <Button color="inherit" onClick={handleLogout}>Sair</Button>
                </>
             )}
             {/* Opcional: Seções diferentes para usuários não autenticados (ex: Link para Login/Cadastro) */}
             {!isAuthenticated && (
                  <>
                      {/* Link para Login (se a rota '/' redireciona) */}
                      {/* <Button color="inherit" component={Link} to="/login">Login</Button> */}
                      {/* Link para Cadastro */}
                       <Button color="inherit" component={Link} to="/cadastro-usuario">Cadastro</Button>
                  </>
             )}
          </Box>

          {/* TODO: Menu responsivo para telas pequenas */}

        </Toolbar>
      </AppBar>

      {/* Conteúdo da Página */}
      <Box component="main" sx={{ p: 3 }}> {/* Usar Box com padding para o conteúdo principal */}
        {children} {/* Renderiza o conteúdo da página real aqui */}
      </Box>
    </Box>
  );
};

export default Layout;