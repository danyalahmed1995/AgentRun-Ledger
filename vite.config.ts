import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  root: 'src/dashboard',
  build: {
    outDir: '../../dist/dashboard',
    emptyOutDir: true
  },
  server: {
    host: '127.0.0.1'
  }
});
