import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Esto permite conexiones externas
    port: 5173, // Puerto por defecto
    strictPort: true, // Usar siempre este puerto
    hmr: {
      clientPort: 443 // Para que funcione el hot reload con ngrok
    },
    // Permitir todos los hosts (incluyendo ngrok)
    allowedHosts: [
      '.ngrok-free.app', // Permite cualquier subdominio de ngrok
      '.ngrok.io', // Por si usas ngrok.io
      'localhost',
      '127.0.0.1'
    ]
  }
})