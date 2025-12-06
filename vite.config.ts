
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1600kb para evitar warnings amarelos no build
    chunkSizeWarningLimit: 1600,
  },
})
