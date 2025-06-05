// frontend/src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
// Importe os componentes de roteamento
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Importe Navigate para redirecionamentos

// Importe suas páginas
import Login from "./pages/Login";
import Home from "./pages/Home"; // Esta será sua página protegida inicial
import CadastroUsuario from "./pages/CadastroUsuario";
import AmbientesPage from "./pages/AmbientesPage";
import AmbienteDetailPage from "./pages/AmbienteDetailPage";
import MyReservasPage from "./pages/MyReservasPage";
import CalendarPage from "./pages/CalendarPage";
import RequestReservaPage from "./pages/RequestReservaPage";

// Importe seu componente de Rota Protegida (vamos criar em seguida)
import ProtectedRoute from "./components/ProtectedRoute";


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

        {/*Rota protegida para a página de Lista de Ambientes */}
        <Route
          path="/ambientes" // Defina o caminho da rota (ex: /ambientes)
          element={
            <ProtectedRoute>
              <AmbientesPage /> {/* Renderiza a página AmbientesPage APENAS se autenticado */}
            </ProtectedRoute>
          }
        />

        {/*Rota protegida para a página de Detalhes de Ambiente */}
        {/* Use um parâmetro na URL ':ambienteId' para o ID do ambiente */}
        <Route
          path="/ambientes/:ambienteId" // Ex: /ambientes/5, /ambientes/12
          element={
            <ProtectedRoute>
              <AmbienteDetailPage /> {/* Renderiza a página de detalhes APENAS se autenticado */}
            </ProtectedRoute>
          }
        />

        {/* Rota protegida para a página de Minhas Reservas */}
        <Route
          path="/minhas-reservas" // Defina o caminho da rota (ex: /minhas-reservas)
          element={
            <ProtectedRoute>
              <MyReservasPage /> {/* Renderiza a página MyReservasPage APENAS se autenticado */}
            </ProtectedRoute>
          }
        />

        {/* Rota protegida para a página de Calendário */}
        <Route
          path="/calendario" // Defina o caminho da rota (ex: /calendario)
          element={
            <ProtectedRoute>
              <CalendarPage /> {/* Renderiza a página CalendarPage APENAS se autenticado */}
            </ProtectedRoute>
          }
        />

        {/* Rota protegida para a página de Solicitação de Reserva */}
        <Route
          path="/solicitar-reserva" // Defina o caminho da rota
          element={
            <ProtectedRoute>
              <RequestReservaPage /> {/* Renderiza a página APENAS se autenticado */}
            </ProtectedRoute>
          }
        />


        {/* TODO: Adicionar rotas protegidas para outras páginas (Gerenciar, Histórico, etc.) */}


        {/* Rota padrão para a raiz '/' (redireciona para login) */}
         <Route path="/" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);