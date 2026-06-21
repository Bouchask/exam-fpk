import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    // Proxy API requests to the backend in development
    proxy: {
      '/api': {
        target: 'http://localhost:5006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
    // Ensure the dev server uses a consistent port
    port: 5173,
  },
  // Build configuration for Vercel
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
