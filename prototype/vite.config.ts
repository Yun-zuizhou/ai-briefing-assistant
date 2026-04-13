import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/api-config': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
