// frontend/src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
// Importe os componentes de roteamento
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Importe Navigate para redirecionamentos

// Importe suas páginas
import Login from "./pages/Login";
import Home from "./pages/Home"; // Esta será sua página protegida inicial
import CadastroUsuario from "./pages/CadastroUsuario";

// Importe seu componente de Rota Protegida (vamos criar em seguida)
import ProtectedRoute from "./components/ProtectedRoute";


// console.log('API URL:', import.meta.env.VITE_API_URL) // REMOVER a linha de console.log

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* BrowserRouter habilita o roteamento */}
    <BrowserRouter>
      {/* Routes define a área onde as rotas serão renderizadas */}
      <Routes>
        {/* Rota para a página de Login */}
        <Route path="/login" element={<Login />} /> {/* Rota para a página de Login */}
        {/* Rota para a página de Cadastro */}
        <Route path="/cadastro-usuario" element={<CadastroUsuario />} />

        {/* 
          Rota para a página inicial (Home/Dashboard).
          Esta rota deve ser PROTEGIDA.
          Usamos o componente ProtectedRoute para verificar a autenticação antes de renderizar Home.
        */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home /> {/* Renderiza a página Home APENAS se autenticado */}
            </ProtectedRoute>
          }
        />

        {/* 
          Rota padrão para a raiz '/'.
          Redireciona para /login (se não logado) ou /home (se logado).
          Podemos usar um componente para checar o estado de autenticação e redirecionar.
          Ou simplesmente redirecionar para /login por padrão.
        */}
         <Route path="/" element={<Navigate to="/login" replace />} /> {/* Redireciona a raiz para /login */}


        {/* TODO: Adicionar rotas para outras páginas aqui conforme você as criar */}
        {/* <Route path="/ambientes" element={<ProtectedRoute><AmbientesPage /></ProtectedRoute>} /> */}
        {/* <Route path="/reservas" element={<ProtectedRoute><MyReservasPage /></ProtectedRoute>} /> */}
        {/* <Route path="/ambientes/:ambienteId" element={<ProtectedRoute><AmbienteDetailPage /></ProtectedRoute>} /> */}
        {/* ... e assim por diante ... */}

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);