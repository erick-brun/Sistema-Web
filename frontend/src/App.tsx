// frontend/src/App.tsx

import React from 'react';
// Importe os componentes de roteamento
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importe suas páginas
import Login from './pages/Login';
import Home from './pages/Home';
import CadastroUsuario from './pages/CadastroUsuario';
import AmbientesPage from './pages/AmbientesPage';
import AmbienteDetailPage from './pages/AmbienteDetailPage';
import MyReservasPage from './pages/MyReservasPage';
import CalendarPage from './pages/CalendarPage';
import RequestReservaPage from './pages/RequestReservaPage';
// TODO: Importar outras páginas de admin/histórico conforme criar

// Importe seu componente de Rota Protegida
import ProtectedRoute from './components/ProtectedRoute';


function App() { // Componente App, renderizado dentro do Provedor de Autenticação
    return (
        // BrowserRouter habilita o roteamento (agora dentro de App)
        <BrowserRouter>
          {/* Routes define a área onde as rotas serão renderizadas */}
          <Routes>
            {/* Rota para a página de Login (PÚBLICA) */}
            <Route path="/login" element={<Login />} /> {/* Rota para a página de Login */}
            {/* Rota para a página de Cadastro (PÚBLICA) */}
            <Route path="/cadastro-usuario" element={<CadastroUsuario />} />

            {/* 
              Rotas PROTEGIDAS (exigem autenticação).
              Usamos o componente ProtectedRoute para verificar a autenticação.
            */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home /> {/* Renderiza a página Home APENAS se autenticado */}
                </ProtectedRoute>
              }
            />

            <Route
              path="/ambientes"
              element={
                <ProtectedRoute>
                  <AmbientesPage />
                </ProtectedRoute>
              }
            />

             <Route
               path="/ambientes/:ambienteId"
               element={
                 <ProtectedRoute>
                   <AmbienteDetailPage />
                 </ProtectedRoute>
               }
             />

            <Route
              path="/minhas-reservas"
              element={
                <ProtectedRoute>
                  <MyReservasPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendario"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/solicitar-reserva"
              element={
                <ProtectedRoute>
                  <RequestReservaPage />
                </ProtectedRoute>
              }
            />

            {/* TODO: Adicionar rotas protegidas para páginas de Administração (Gerenciar Usuários, Ambientes, Reservas, Histórico) */}
            {/* Essas rotas precisarão verificar se o usuário é ADMIN (além de logado). */}


            {/* Rota padrão para a raiz '/' (redireciona para login) */}
             <Route path="/" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
    );
}

export default App;