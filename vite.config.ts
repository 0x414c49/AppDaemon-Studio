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
    // Disable esbuild CSS minifier to avoid false CSS syntax warnings
    // triggered by Tailwind's CSS custom property declarations.
    cssMinify: false,
  },
  server: {
    // Dev proxy: forward API calls to .NET backend
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
