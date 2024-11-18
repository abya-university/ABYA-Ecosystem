import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodePolyfills from 'vite-plugin-node-stdlib-browser';

export default defineConfig({
  plugins: [react(), nodePolyfills()],
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