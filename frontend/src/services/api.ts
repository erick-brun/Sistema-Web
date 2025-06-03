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
  (response) => {
    // Se a resposta for bem-sucedida (status 2xx), apenas retorna a resposta.
    return response;
  },
  async (error) => {
    // Lida com respostas de erro (status 4xx ou 5xx).
    const originalRequest = error.config; // A configuração da requisição original.

    // Verifica se o erro é 401 Unauthorized.
    // Exclui a rota de login para evitar loop infinito de redirecionamento.
    if (error.response && error.response.status === 401 && originalRequest.url !== `${API_URL}/usuarios/login`) {
      // TODO: Lógica para Refresh Token ou Redirecionar para Login.
      // Implementação simples: Redireciona para a página de login.

      console.log('Token expirado ou inválido. Redirecionando para login...');

      // Limpa o token inválido do armazenamento.
      localStorage.removeItem('accessToken');
      // Opcional: localStorage.removeItem('refreshToken'); se estiver usando.

      // Redireciona o usuário para a página de login.
      // Se estiver usando react-router-dom v6, pode precisar de 'useNavigate' em um componente.
      // Uma forma simples de redirecionar é usando a API do navegador:
      window.location.href = '/login'; // Adapte o caminho da sua rota de login se não for /login
      // Se sua rota de login for '/' e sua rota inicial for '/home', pode ser:
      // window.location.href = '/';

      // Retorna uma Promise rejeitada para parar o fluxo de processamento do erro.
      return Promise.reject(error);

      /* TODO: Lógica de Refresh Token (Mais Avançado)
         Se estiver usando Refresh Tokens:
         try {
           const refreshToken = localStorage.getItem('refreshToken');
           if (refreshToken) {
             // Chama seu endpoint de refresh token
             const refreshResponse = await axios.post(`${API_URL}/usuarios/refresh`, { refresh_token: refreshToken });
             const newAccessToken = refreshResponse.data.access_token;
             const newRefreshToken = refreshResponse.data.refresh_token; // Se o refresh também retornar um novo refresh

             // Armazena os novos tokens
             localStorage.setItem('accessToken', newAccessToken);
             localStorage.setItem('refreshToken', newRefreshToken); // Se o refresh retornar novo refresh

             // Tenta refazer a requisição original que falhou com o novo token
             originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
             return axios(originalRequest); // Retorna a nova requisição para ser processada

           } else {
             // Sem refresh token disponível, redireciona para login
             console.log('Sem refresh token disponível. Redirecionando para login...');
             localStorage.removeItem('accessToken');
             window.location.href = '/login';
             return Promise.reject(error); // Rejeita o erro original
           }
         } catch (refreshError) {
           // Erro ao refrescar o token (ex: refresh token expirado ou inválido)
           console.error('Falha ao refrescar token:', refreshError);
           localStorage.removeItem('accessToken');
           localStorage.removeItem('refreshToken'); // Limpa ambos os tokens
           window.location.href = '/login'; // Redireciona para login
           return Promise.reject(refreshError); // Rejeita o erro de refresh
         }
      */
    }

    // Para outros erros (400, 403, 404, 500, etc.), apenas propaga o erro.
    // Os componentes que chamam a API lidarão com esses erros específicos.
    return Promise.reject(error);
  }
);

// Exporte a instância axios configurada para usar em seus componentes.
export default api;