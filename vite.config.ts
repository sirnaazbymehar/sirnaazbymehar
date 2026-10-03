import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the API runs on :8787 (npm run dev starts both); Vite forwards /api and /uploads to it.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/uploads': 'http://localhost:8787',
    },
  },
})
