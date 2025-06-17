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
import HistoryPage from './pages/HistoryPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageAmbientesPage from './pages/ManageAmbientesPage';
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

            {/* Rota protegida para a página de Solicitação de Reserva (Criação) */}
            <Route
              path="/solicitar-reserva" // URL para CRIAR nova reserva
              element={
                <ProtectedRoute>
                  <RequestReservaPage /> {/* Renderiza o componente */}
                </ProtectedRoute>
              }
            />

            {/* Rota protegida para a página de Edição de Reserva */}
            <Route
              path="/reservas/editar/:reservaId" // URL para EDITAR reserva existente, com parâmetro ID
              element={
                <ProtectedRoute>
                  <RequestReservaPage /> {/* **REUTILIZA O MESMO COMPONENTE** */}
                </ProtectedRoute>
              }
            />


            {/* Rota protegida para a página de Histórico Pessoal */}
             <Route
               path="/historico-reservas" // <--- Caminho da rota
               element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} // <--- Usa ProtectedRoute e HistoryPage
             />

            {/* Rota protegida para a página de Gerenciar Usuários (Admin) */}
             <Route
               path="/gerenciar-usuarios" // <--- Caminho da rota
               element={<ProtectedRoute><ManageUsersPage /></ProtectedRoute>} // <--- Usa ProtectedRoute e ManageUsersPage
             />

            {/* Rota protegida para a página de Gerenciar Ambientes (Admin) */}
             <Route
               path="/gerenciar-ambientes" // <--- Caminho da rota
               element={<ProtectedRoute><ManageAmbientesPage /></ProtectedRoute>} // <--- Usa ProtectedRoute e ManageAmbientesPage
             />


            {/*TODO: Adicionar outras rotas protegidas para páginas de Administração (Gerenciar Todas as Reservas, Histórico Geral) */}
            {/* ... */}


            {/* Rota padrão para a raiz '/' (redireciona para login) */}
             <Route path="/" element={<Navigate to="/login" replace />} />

          </Routes>
        </BrowserRouter>
    );
}

export default App;