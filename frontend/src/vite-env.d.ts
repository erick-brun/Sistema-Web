/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string // <-- Adicione ou garanta que esta linha existe
  // adicione outras variáveis de ambiente que começam com VITE_ aqui
  readonly VITE_NGINX_EXTERNAL_PORT?: string // Exemplo se você usar NGINX_EXTERNAL_PORT diretamente no frontend
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}