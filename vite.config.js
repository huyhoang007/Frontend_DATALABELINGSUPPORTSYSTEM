import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      },
      // NOTE: Restart dev server after changing proxy config!
      // Spring Boot static-locations: file:uploads/ serves at root URL,
      // so we strip /uploads prefix => /uploads/project_5/img.png → /project_5/img.png
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/uploads/, ''),
      },
    },
  },
})
