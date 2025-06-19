// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';

// Importe o ThemeProvider do Material UI
import { ThemeProvider } from '@mui/material/styles'; // <--- ADICIONADO
// Importe seu tema customizado
import theme from './theme'; // <--- ADICIONADO: Importa seu tema customizado

// Importe o Provedor de Autenticação
import { AuthProvider } from './context/AuthContext';
// Importe o componente App
import App from './App';

// Opcional: Importe seus estilos globais (index.css)
import './index.css';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* **ADICIONADO:** Envolver com ThemeProvider para aplicar o tema MU */}
    <ThemeProvider theme={theme}> {/* <--- ADICIONADO */}
      {/* Provedor de autenticação envolve o App */}
      <AuthProvider>
         <App /> {/* Renderiza o componente App (que contém o roteamento) */}
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);