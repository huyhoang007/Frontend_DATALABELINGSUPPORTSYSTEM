import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    // Chi scan trong thu muc src de tranh quet toan bo o dia.
    entries: ['./src/main.jsx'],
  },
})
