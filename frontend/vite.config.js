import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Configuración del servidor de desarrollo
  server: {
    port: 3000,
    open: true, // Abre el navegador automáticamente
    
    // Proxy para el backend (IMPORTANTE)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // Variables de entorno
  define: {
    'process.env': {}
  }
})