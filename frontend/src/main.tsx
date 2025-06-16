// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';

// Importe o componente App e o Provedor de Autenticação
import App from './App'; // Importa o novo App.tsx
import { AuthProvider } from './context/AuthContext'; // Importa o Provedor

// Opcional: Importe seus estilos globais
// import './index.css';

// Opcional: Se estiver usando Material UI e precisar de configurações no root
// import { ThemeProvider } from '@mui/material/styles';
// import theme from './theme'; // Defina seu tema

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Envolva o componente App com o Provedor de Autenticação */}
    <AuthProvider>
       {/* Opcional: Envolver com ThemeProvider ou outros provedores aqui */}
      <App /> {/* Renderiza o componente App */}
    </AuthProvider>
  </React.StrictMode>
);