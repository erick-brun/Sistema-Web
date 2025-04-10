import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import CadastroUsuario from "./pages/CadastroUsuario"; // ✅ Novo nome

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/cadastro-usuario" element={<CadastroUsuario />} /> {/* ✅ Rota atualizada */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
