import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  server: {
    proxy: {
      //tempoprary proxy of localhost and port to avoid CORS
      '/api': {target: 'http://localhost:8080', changeOrigin: true, secure: false,cookieDomainRewrite: '',},
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})