import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      // Proxy API calls to the Go backend during local dev
      '/login': 'http://localhost:8080',
      '/employees': 'http://localhost:8080',
      '/clients': 'http://localhost:8080',
      '/delivery-points': 'http://localhost:8080',
      '/products': 'http://localhost:8080',
      '/sku': 'http://localhost:8080',
      '/requests': 'http://localhost:8080',
      '/arrivals': 'http://localhost:8080',
      '/arrivals-requests': 'http://localhost:8080',
      '/vehicles': 'http://localhost:8080',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
})
