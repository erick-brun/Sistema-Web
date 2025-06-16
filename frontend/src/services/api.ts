// frontend/src/services/api.ts

import axios from 'axios';
// Se estiver usando react-router-dom para redirecionamento programático:
// import { createBrowserHistory } from 'history'; // Exemplo para v5
// const history = createBrowserHistory(); // Exemplo para v5
// Para v6, você pode precisar de uma abordagem diferente ou redirecionar via window.location

// Use a variável de ambiente VITE_API_URL definida no .env da pasta frontend
const API_URL: string = import.meta.env.VITE_API_URL;

// Crie uma instância do axios com a URL base da API
const api = axios.create({
  baseURL: API_URL,
  // Você pode adicionar outros defaults aqui, como headers
  headers: {
    'Content-Type': 'application/json',
  },
});

// Use a URL base para construir a URL completa do endpoint de login para comparação
const LOGIN_URL = `${API_URL}/usuarios/login`; // Defina a URL completa do login

// =============================================
// Interceptor de Requisição: Adicionar o Token JWT
// =============================================
// Este interceptor será executado ANTES de cada requisição ser enviada.
// Ele verifica se existe um token de acesso armazenado e o adiciona ao header Authorization.
api.interceptors.request.use(
  (config) => {
    // Obtenha o token do armazenamento local (ex: LocalStorage)
    const token = localStorage.getItem('accessToken'); // Use 'accessToken' como a chave

    // Se o token existir, adicione-o ao header Authorization no formato Bearer.
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Retorna a configuração da requisição modificada.
    return config;
  },
  (error) => {
    // Lida com erros na configuração da requisição (raro).
    return Promise.reject(error);
  }
);

// =============================================
// Interceptor de Resposta: Lidar com Erros (ex: 401 Unauthorized)
// =============================================
// Este interceptor será executado QUANDO uma resposta da API for recebida.
// Ele é útil para lidar globalmente com certos status codes de erro.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // **CORREÇÃO:** Compare a URL da requisição original com a URL completa do login endpoint.
    // Certifique-se que a URL original da requisição que retornou 401 NÃO é o endpoint de login.
    if (error.response && error.response.status === 401 && originalRequest.url !== LOGIN_URL) {
      console.log('Token expirado ou inválido. Redirecionando para login...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('loggedInUserId'); // Se armazenou o ID
      window.location.href = '/login'; // Redireciona
      return Promise.reject(error);
    }

    // Para outros erros (incluindo 401 na página de login), apenas propaga o erro.
    // O componente Login.tsx vai capturar o 401 e exibir a mensagem "Credenciais inválidas".
    return Promise.reject(error);
  }
);

// Exporte a instância axios configurada para usar em seus componentes.
export default api;