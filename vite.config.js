import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'vite-plugin-node-stdlib-browser';

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      usePolling: true,
    },
  },
  resolve: {
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
      util: 'util',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});