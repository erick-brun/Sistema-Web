// frontend/src/components/Layout.tsx

import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importar componentes de UI do Material UI
import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';

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

  const handleLogout = () => {
    logout();
  };

  if (authLoading) {
    return null; // Ou um spinner global
  }


  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={0} sx={{ width: '100%', borderBottom: 'none' }}>
        <Toolbar> {/* Padding definido no tema, alignItems: 'center' no tema */}
          {/* Logo do Senai - **VERIFICAR:** Box com alignItems: 'center' */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}> {/* alignItems: 'center' aqui */}
              <img src={senaiLogo} alt="Logo Senai" style={{ height: 50 }} /> {/* **MODIFICADO:** Ajustar altura da logo */}
          </Box>

          {/* Links de Navegação - Alinhados à Direita e Centralizados Verticalmente */}
          {/* **VERIFICAR:** Este Box DEVE estar alinhado verticalmente */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
             {isAuthenticated && (
                <>
                   {/* Botões usando Button component={Link} */}
                   {/* Estilos de fonte, padding, hover definidos no tema para MuiButton */}
                   <Button color="inherit" component={Link} to="/home">Início</Button> {/* color="inherit" pega a cor contrastante da AppBar (cinza escuro) */}
                   <Button color="inherit" component={Link} to="/ambientes">Ambientes</Button>
                   <Button color="inherit" component={Link} to="/minhas-reservas">Minhas Reservas</Button>
                   {/* <Button color="inherit" component={Link} to="/calendario">Calendário</Button> */}
                   <Button color="inherit" component={Link} to="/solicitar-reserva">Solicitar</Button>
                   <Button color="inherit" component={Link} to="/historico-reservas">Meu Histórico</Button>

                   {/* Links de Administração (visíveis APENAS se o usuário for Admin) */}
                   {user?.tipo === 'admin' && (
                       <>
                           <Button color="inherit" component={Link} to="/gerenciar-usuarios">Ger. Usuários</Button>
                           <Button color="inherit" component={Link} to="/gerenciar-ambientes">Ger. Ambientes</Button>
                           <Button color="inherit" component={Link} to="/gerenciar-reservas">Ger. Reservas</Button>
                           <Button color="inherit" component={Link} to="/gerenciar-historico-reservas">Hist. Geral</Button>
                       </>
                   )}

                   {/* Botão de Logout */}
                   <Button color="inherit" onClick={handleLogout}>Sair</Button>
                </>
             )}
             {/* ... links para não autenticados ... */}
              {!isAuthenticated && (
                  <Button color="inherit" component={Link} to="/cadastro-usuario">Cadastro</Button>
              )}
          </Box>

          {/* TODO: Menu responsivo para telas pequenas */}

        </Toolbar>
      </AppBar>

      {/* Conteúdo da Página */}
      {/* Box component="main" sx={{ p: 3 }}> // Padding nas páginas (definido no tema Typography.styleOverrides também pode ser) */}
      {/* O padding no Box principal da página pode ser ajustado aqui ou nas páginas individuais */}
       <Box component="main"> {/* Removido padding padrão aqui, pode ser adicionado nas páginas */}
        {children} {/* Renderiza o conteúdo da página real aqui */}
      </Box>
    </Box>
  );
};

export default Layout;