import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9898,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:19020',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    port: 9898,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'pocket.one',
      'pocketone.eu',
      '.pocket.one',
      '.pocketone.eu',
      'uin-generator.app',
      '.uin-generator.app',
      'localhost',
      '192.168.0.2',
      '10.100.1.2',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:19020',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
