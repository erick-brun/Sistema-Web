// frontend/src/App.tsx

import React from 'react';
// Importe os componentes de roteamento
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importa páginas
import Login from './pages/Login';
import Home from './pages/Home';
import CadastroUsuario from './pages/CadastroUsuario';
import AmbientesPage from './pages/AmbientesPage';
import AmbienteDetailPage from './pages/AmbienteDetailPage';
import MyReservasPage from './pages/MyReservasPage';
import CalendarPage from './pages/CalendarPage';
import RequestReservaPage from './pages/RequestReservaPage';
import HistoryPage from './pages/HistoryPage'; // Histórico Pessoal
import ManageUsersPage from './pages/ManageUsersPage';
import ManageAmbientesPage from './pages/ManageAmbientesPage';
import ManageReservasPage from './pages/ManageReservasPage';
import HistoryPageAdmin from './pages/HistoryPageAdmin'; // Histórico geral para admins

// Importe seu componente de Rota Protegida
import ProtectedRoute from './components/ProtectedRoute';


// Se o roteamento estiver dentro de App.tsx (renderizado por main.tsx com AuthProvider)
function App() { // Componente App
    return (
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro-usuario" element={<CadastroUsuario />} />

            {/* Rotas Protegidas - Envolva cada uma com ProtectedRoute */}
            <Route
              path="/home"
              element={<ProtectedRoute><Home /></ProtectedRoute>}
            />
            {/* ... outras rotas protegidas existentes ... */}
            <Route
              path="/ambientes"
              element={<ProtectedRoute><AmbientesPage /></ProtectedRoute>}
            />
            <Route
              path="/ambientes/:ambienteId"
              element={<ProtectedRoute><AmbienteDetailPage /></ProtectedRoute>}
            />
             <Route
              path="/reservas/editar/:reservaId" // Rota de edição
              element={<ProtectedRoute><RequestReservaPage /></ProtectedRoute>}
            />
            <Route
              path="/minhas-reservas"
              element={<ProtectedRoute><MyReservasPage /></ProtectedRoute>}
            />
            <Route
               path="/calendario"
               element={<ProtectedRoute><CalendarPage /></ProtectedRoute>}
             />
             <Route
               path="/solicitar-reserva"
               element={<ProtectedRoute><RequestReservaPage /></ProtectedRoute>}
             />
             <Route
               path="/historico-reservas" // Histórico Pessoal
               element={<ProtectedRoute><HistoryPage /></ProtectedRoute>}
             />
             <Route
               path="/gerenciar-usuarios"
               element={<ProtectedRoute><ManageUsersPage /></ProtectedRoute>}
             />
             <Route
               path="/gerenciar-ambientes"
               element={<ProtectedRoute><ManageAmbientesPage /></ProtectedRoute>}
             />
             <Route
               path="/gerenciar-reservas"
               element={<ProtectedRoute><ManageReservasPage /></ProtectedRoute>}
             />

             {/* Rota protegida para a página de Histórico Geral (Admin) */}
             <Route
               path="/gerenciar-historico-reservas" // <--- Caminho da rota para Histórico Geral
               element={<ProtectedRoute><HistoryPageAdmin /></ProtectedRoute>} // <--- Usa ProtectedRoute e HistoryPageAdmin
             />


            {/* TODO: Adicionar outras rotas protegidas se necessário */}
            {/* ... */}

            {/* Rota padrão para a raiz '/' (redireciona para login) */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
    );
}

export default App; // Exporta App se o roteamento estiver nele