import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  // https://vite.dev/config/
  export default defineConfig({
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      watch: {
        usePolling: true  // NUEVO: Fuerza detección de cambios
      },
      hmr: {
        clientPort: process.env.NGROK_URL ? 443 : 5173
      },
      allowedHosts: [
        '.ngrok-free.app',
        '.ngrok.io',
        'localhost',
        '127.0.0.1'
      ]
    },
    optimizeDeps: {
      force: true  // NUEVO: Fuerza re-optimización
    },
    cacheDir: '.vite-new'  // NUEVO: Usa un directorio de caché diferente
  })