import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/pix-api': {
        target: 'https://gerarqrcodepix.com.br/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pix-api/, '')
      }
    },
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' data: https://fonts.gstatic.com https://use.typekit.net;
        img-src 'self' data: https:;
        connect-src 'self' https://evolution.abdesignerpro.com.br https://gerarqrcodepix.com.br;
      `.replace(/\s+/g, ' ').trim()
    }
  }
})
