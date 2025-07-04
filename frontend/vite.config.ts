import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // permite acesso externo (ex: dentro do container)
    port: 5173,      // garante a porta padrão do Vite
    strictPort: true, // se a porta estiver em uso, não tenta outra
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
