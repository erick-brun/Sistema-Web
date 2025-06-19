// frontend/src/services/api.ts

import axios, { AxiosError } from 'axios'; // <--- Importe AxiosError para tipagem
// Se estiver usando react-router-dom para redirecionamento programático:
// import { createBrowserHistory } from 'history'; // Exemplo para v5
// const history = createBrowserHistory(); // Exemplo para v5
// Para v6, você pode precisar de uma abordagem diferente ou redirecionar via window.location

// Use a variável de ambiente VITE_API_URL definida no .env da pasta frontend
const API_URL: string = import.meta.env.VITE_API_URL;

// Defina o caminho relativo do endpoint de login para comparação no interceptor
const LOGIN_PATH = '/usuarios/login'; // <--- Defina o CAMINHO relativo do endpoint de login

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
    // Nota: Mesmo que a requisição seja para /usuarios/login, o token será adicionado.
    // Isso não causa problema no backend se a rota de login não esperar autenticação.
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
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Lógica de redirecionamento/limpeza SÓ se for 401 E NÃO for o endpoint de login
    const requestUrl = originalRequest?.url || '';
    let relativeRequestPath = requestUrl;

    // **CORREÇÃO:** Acessar baseURL através do objeto 'api'
    const baseURL = api.defaults.baseURL || ''; // <--- CORRIGIDO: Acessa o baseURL da instância api.

    // Se a URL original for absoluta e começar com baseURL, remova baseURL para obter o caminho relativo
    if (baseURL && requestUrl.startsWith(baseURL)) {
         relativeRequestPath = requestUrl.substring(baseURL.length);
         // Garante que o caminho relativo começa com '/'
         if (!relativeRequestPath.startsWith('/')) {
              relativeRequestPath = '/' + relativeRequestPath;
         }
    }
    // Opcional: Log para verificar o caminho relativo
    // console.log("Interceptor: URL Original:", requestUrl, "Base URL:", baseURL, "Caminho Relativo:", relativeRequestPath);


    const isLoginEndpoint = relativeRequestPath.endsWith(LOGIN_PATH);

    if (error.response && error.response.status === 401 && !isLoginEndpoint) {
      console.log('Interceptor 401: Token expirado ou inválido. Redirecionando para login...');
      // ... lógica de limpeza de storage e redirecionamento ...
      localStorage.removeItem('accessToken');
      localStorage.removeItem('loggedInUserId');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Para outros erros (incluindo 401 na página de login), apenas propaga o erro.
    return Promise.reject(error);
  }
);

// Exporte a instância axios configurada para usar em seus componentes.
export default api;