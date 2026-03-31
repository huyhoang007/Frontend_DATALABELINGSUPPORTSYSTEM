import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080/',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8080/',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    // Chỉ scan trong thư mục src, tránh scan toàn bộ ổ đĩa
    entries: ['./src/main.jsx'],
  },
})