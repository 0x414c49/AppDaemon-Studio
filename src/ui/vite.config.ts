import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  // No hardcoded base path — relative assets work under any HA ingress prefix
  base: './',
  build: {
    outDir: 'dist',
    cssMinify: false,
    rollupOptions: {
      output: {
        // Explicit content hashes — ensures cache busting on every deploy
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    port: 3000,
    // Dev proxy: forward API calls to .NET backend
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
