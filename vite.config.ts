import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // No hardcoded base path — relative assets work under any HA ingress prefix
  base: './',
  build: {
    outDir: 'dist',
  },
  server: {
    // Dev proxy: forward API calls to .NET backend
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
