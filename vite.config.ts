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
      // Solo usar puerto 443 si se está usando ngrok
      clientPort: process.env.NGROK_URL ? 443 : 5173
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