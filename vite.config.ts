import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['jspdf', 'jspdf-autotable']
  },
  build: {
    outDir: 'dist'
  },
  server: {
    host: true,
    port: 5173
  },
  preview: {
    port: 4173
  }
});
