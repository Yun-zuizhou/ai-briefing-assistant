import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendPort = process.env.BACKEND_PORT ?? '8787'
const backendTarget = `http://127.0.0.1:${backendPort}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
  },
  server: {
    strictPort: true,
    proxy: {
      '/api/v1': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/api-config': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
})
