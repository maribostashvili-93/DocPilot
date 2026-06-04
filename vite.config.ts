import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/docpilot': 'http://127.0.0.1:4179',
      '/api/v2': 'http://127.0.0.1:4179',
    },
  },
})
