import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/chat": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/memories": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/dream": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/datasets": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/system": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/settings": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/metrics": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
    },
  },


})
