// frontend/src/components/Layout.tsx

import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importar componentes de UI do Material UI
import { AppBar, Toolbar, Button, Box, Typography, useTheme } from '@mui/material';

// **ADICIONADO:** Importar a Logo do Senai
// Use a importação especial do Vite para assets da pasta public/
// O nome do arquivo deve ser o nome real do seu arquivo de logo em frontend/public/
// Ex: '/logo_senai.png' ou '/logo_senai.svg'
const senaiLogo = '/logo_senai.png'; // <--- SUBSTITUIR pelo nome do seu arquivo em public/


// Interface para as props do componente Layout (existente)
interface LayoutProps {
  children: ReactNode;
}

// Componente de Layout com Barra de Navegação
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation(); // <--- ADICIONADO: Hook para obter a localização atual
  const theme = useTheme(); // <--- ADICIONADO: Hook para acessar o tema


  const handleLogout = () => {
    logout();
  };

  if (authLoading) {
    return null; // Ou um spinner global
  }


  // Função auxiliar para verificar se um link está ativo
  const isLinkActive = (pathname: string): boolean => {
      // Compara o caminho atual com o caminho do link
      // Lógica pode ser mais complexa se houver sub-rotas (ex: /ambientes/123)
      // Neste caso, se o caminho atual começa com o caminho do link, ele é ativo.
       if (pathname === '/') return location.pathname === '/home' || location.pathname === '/'; // Para o link "Início", considerar '/' e '/home'
       return location.pathname.startsWith(pathname);
  };


  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={0} sx={{ width: '100%', borderBottom: 'none' }}>
        <Toolbar>
          {/* Logo do Senai */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              {/* Opcional: Tornar a Logo um link para a Home */}
              <Link to="/home"> {/* <--- ADICIONADO Link */}
                 <img src={senaiLogo} alt="Logo Senai" style={{ height: 50 }} />
              </Link>
          </Box>

          {/* Links de Navegação - Alinhados à Direita */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}> {/* Ajustar gap */}
             {isAuthenticated && (
                <>
                   {/* Links usando Button component={Link} */}
                   {/* **MODIFICADO:** Adicionar estilo condicional para link ativo */}
                   <Button
                       color="inherit"
                       component={Link}
                       to="/home"
                       // Aplicar estilo se o link está ativo
                       sx={{
                           color: isLinkActive('/home') ? theme.palette.primary.main : theme.palette.text.appBarLink, // Azul se ativo, cinza escuro se inativo
                           fontWeight: isLinkActive('/home') ? 700 : 700, // Negrito se ativo
                       }}
                   >Início</Button> {/* Rota /home */} {/* Corrigido caminho */}

                   <Button
                       color="inherit" component={Link} to="/ambientes"
                       sx={{
                           color: isLinkActive('/ambientes') ? theme.palette.primary.main : theme.palette.text.appBarLink,
                           fontWeight: isLinkActive('/ambientes') ? 700 : 700,
                       }}
                   >Ambientes</Button>

                   <Button
                       color="inherit" component={Link} to="/minhas-reservas"
                       sx={{
                           color: isLinkActive('/minhas-reservas') ? theme.palette.primary.main : theme.palette.text.appBarLink,
                           fontWeight: isLinkActive('/minhas-reservas') ? 700 : 700,
                       }}
                   >Minhas Reservas</Button>

                    {/* REMOVIDO CALENDARIO DA PRIMEIRA VERSAO */}
                   {/* <Button color="inherit" component={Link} to="/calendario">Calendário</Button> */}

                   <Button
                       color="inherit" component={Link} to="/solicitar-reserva"
                       sx={{
                           color: isLinkActive('/solicitar-reserva') ? theme.palette.primary.main : theme.palette.text.appBarLink,
                           fontWeight: isLinkActive('/solicitar-reserva') ? 700 : 700,
                       }}
                   >Solicitar</Button>

                   <Button
                       color="inherit" component={Link} to="/historico-reservas"
                       sx={{
                           color: isLinkActive('/historico-reservas') ? theme.palette.primary.main : theme.palette.text.appBarLink,
                           fontWeight: isLinkActive('/historico-reservas') ? 700 : 700,
                       }}
                   >Meu Histórico</Button>

                   {/* Links de Administração (visíveis APENAS se o usuário for Admin) */}
                   {user?.tipo === 'admin' && (
                       <>
                           <Button
                               color="inherit" component={Link} to="/gerenciar-usuarios"
                               sx={{
                                   color: isLinkActive('/gerenciar-usuarios') ? theme.palette.primary.main : theme.palette.text.appBarLink,
                                   fontWeight: isLinkActive('/gerenciar-usuarios') ? 700 : 700,
                               }}
                           >Ger. Usuários</Button>

                           <Button
                               color="inherit" component={Link} to="/gerenciar-ambientes"
                               sx={{
                                   color: isLinkActive('/gerenciar-ambientes') ? theme.palette.primary.main : theme.palette.text.appBarLink,
                                   fontWeight: isLinkActive('/gerenciar-ambientes') ? 700 : 700,
                               }}
                           >Ger. Ambientes</Button>

                           <Button
                               color="inherit" component={Link} to="/gerenciar-reservas"
                               sx={{
                                   color: isLinkActive('/gerenciar-reservas') ? theme.palette.primary.main : theme.palette.text.appBarLink,
                                   fontWeight: isLinkActive('/gerenciar-reservas') ? 700 : 700,
                               }}
                           >Ger. Reservas</Button>

                           <Button
                               color="inherit" component={Link} to="/gerenciar-historico-reservas"
                               sx={{
                                   color: isLinkActive('/gerenciar-historico-reservas') ? theme.palette.primary.main : theme.palette.text.appBarLink,
                                   fontWeight: isLinkActive('/gerenciar-historico-reservas') ? 700 : 700,
                               }}
                           >Hist. Geral</Button>
                       </>
                   )}

                   {/* Botão de Logout */}
                   {/* **MODIFICADO:** Adicionar cor de erro (vermelho) ao botão Sair */}
                   {/* Usar color="error" em vez de color="inherit" */}
                   {/* Removido ml: 2 se gap for suficiente */}
                   <Button color="error" onClick={handleLogout}>Sair</Button>
                </>
             )}
             {/* Links para não autenticados (se visível) */}
              {!isAuthenticated && (
                  <Button color="inherit" component={Link} to="/cadastro-usuario">Cadastro</Button>
              )}
          </Box>

          {/* TODO: Menu responsivo para telas pequenas */}

        </Toolbar>
      </AppBar>

      {/* Conteúdo da Página */}
      <Box component="main" sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;