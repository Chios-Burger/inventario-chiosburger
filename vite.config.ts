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
    cacheDir: '.vite-new',  // NUEVO: Usa un directorio de caché diferente
    build: {
      // Configuración específica para producción
      target: 'es2015', // Mejor compatibilidad con navegadores
      minify: 'esbuild',
      sourcemap: false,
      cssMinify: true,
      rollupOptions: {
        output: {
          // Evitar problemas de code splitting
          manualChunks: undefined,
          // Asegurar que los assets tengan nombres consistentes
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    },
    // Asegurar que los estilos inline funcionen en producción
    css: {
      modules: {
        localsConvention: 'camelCase'
      }
    }
  })