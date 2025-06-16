/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string 
  
  readonly VITE_NGINX_EXTERNAL_PORT?: string 
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}