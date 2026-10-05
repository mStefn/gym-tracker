import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://192.168.1.64:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // ucina '/api'
      }
    }
  }
})