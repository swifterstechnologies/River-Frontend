import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
  base: '/River-Frontend/',
  plugins: [react()],
  server: {
    port: 3000
  }
});
