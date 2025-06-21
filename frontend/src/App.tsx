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
// import CalendarPage from './pages/CalendarPage';
import RequestReservaPage from './pages/RequestReservaPage';
import HistoryPage from './pages/HistoryPage'; // Histórico Pessoal
import ManageUsersPage from './pages/ManageUsersPage';
import ManageAmbientesPage from './pages/ManageAmbientesPage';
import ManageReservasPage from './pages/ManageReservasPage';
import HistoryPageAdmin from './pages/HistoryPageAdmin'; // Histórico Geral

// Importe seu componente de Rota Protegida E o componente de Layout
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';


function App() { // Componente App
    return (
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro-usuario" element={<CadastroUsuario />} />

            {/* 
              Rotas PROTEGIDAS (exigem autenticação).
            */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  {/* página Home */}
                  <Layout><Home /></Layout>
                </ProtectedRoute>
              }
            />
            {/* ... outras rotas protegidas existentes ... */}
            <Route
              path="/ambientes"
              element={
                <ProtectedRoute>
                  {/* página AmbientesPage */}
                  <Layout><AmbientesPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ambientes/:ambienteId"
              element={
                <ProtectedRoute>
                  {/* página AmbienteDetailPage */}
                  <Layout><AmbienteDetailPage /></Layout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/reservas/editar/:reservaId" // Rota de edição
              element={
                <ProtectedRoute>
                  {/* **ADICIONADO:** Layout envolve a página RequestReservaPage */}
                  <Layout><RequestReservaPage /></Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/minhas-reservas"
              element={
                <ProtectedRoute>
                  {/* **ADICIONADO:** Layout envolve a página MyReservasPage */}
                  <Layout><MyReservasPage /></Layout>
                </ProtectedRoute>
              }
            // />
            // <Route
            //    path="/calendario"
            //    element={
            //      <ProtectedRoute>
            //        {/* **ADICIONADO:** Layout envolve a página CalendarPage */}
            //        <Layout><CalendarPage /></Layout>
            //      </ProtectedRoute>
            //    }
             />
             <Route
               path="/solicitar-reserva"
               element={
                 <ProtectedRoute>
                   {/* **ADICIONADO:** Layout envolve a página RequestReservaPage (para criação) */}
                   <Layout><RequestReservaPage /></Layout>
                 </ProtectedRoute>
               }
             />
             <Route
               path="/historico-reservas" // Histórico Pessoal
               element={
                 <ProtectedRoute>
                   {/* **ADICIONADO:** Layout envolve a página HistoryPage */}
                   <Layout><HistoryPage /></Layout>
                 </ProtectedRoute>
               }
             />
             <Route
               path="/gerenciar-usuarios" // Gerenciar Usuários
               element={
                 <ProtectedRoute>
                   {/* **ADICIONADO:** Layout envolve a página ManageUsersPage */}
                   <Layout><ManageUsersPage /></Layout>
                 </ProtectedRoute>
               }
             />
             <Route
               path="/gerenciar-ambientes" // Gerenciar Ambientes
               element={
                 <ProtectedRoute>
                   {/* **ADICIONADO:** Layout envolve a página ManageAmbientesPage */}
                   <Layout><ManageAmbientesPage /></Layout>
                 </ProtectedRoute>
               }
             />
             <Route
               path="/gerenciar-reservas" // Gerenciar Todas as Reservas
               element={
                 <ProtectedRoute>
                   {/* **ADICIONADO:** Layout envolve a página ManageReservasPage */}
                   <Layout><ManageReservasPage /></Layout>
                 </ProtectedRoute>
               }
             />
             <Route
               path="/gerenciar-historico-reservas" // Histórico Geral
               element={
                 <ProtectedRoute>
                   {/* **ADICIONADO:** Layout envolve a página HistoryPageAdmin */}
                   <Layout><HistoryPageAdmin /></Layout>
                 </ProtectedRoute>
               }
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