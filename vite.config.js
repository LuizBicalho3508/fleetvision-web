import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
      '/storage': 'http://127.0.0.1:3001',
      '/notifications': 'http://127.0.0.1:3001'
    }
  },
  build: {
    chunkSizeWarningLimit: 1600
  }
});
