import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Local Impeccable / QA against prod API without CORS fights.
    proxy: {
      '/login-registro': 'https://api.deliberatecoaching.com',
      '/admin': 'https://api.deliberatecoaching.com',
    },
  },
})
