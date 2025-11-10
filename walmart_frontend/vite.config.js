// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    'window.global': {},
  },
  server: {
    proxy: {
      // Permintaan ke /api akan diteruskan ke target
      '/api': {
        target: 'http://192.168.229.129:5100',
        changeOrigin: true,
        // Menghapus /api dari path sebelum meneruskan
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/websocket': {
        target: 'http://10.35.148.59:5001',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/websocket/, ''),
      }
    },
    host: '0.0.0.0',
    port: 5173,
    open: true,
  },
})