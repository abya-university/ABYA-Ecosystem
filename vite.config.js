import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
      util: 'util',
      hardhat: false,
      "@nomicfoundation/hardhat-toolbox": false,
      "@nomicfoundation/edr": false,
    },
  },
  optimizeDeps: {
    exclude: [
      "hardhat",
      "@nomicfoundation/hardhat-toolbox",
      "@nomicfoundation/edr",
    ],
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    target: 'es2020',
  },
  server: {
    proxy: {
      // forward requests starting with /evaluate to your AI microservice
      "/evaluate": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        // rewrite if your backend expects it at root:
        // rewrite: (path) => path.replace(/^\/evaluate/, "/evaluate")
      },
    },
    allowedHosts: ['14616d900f29.ngrok-free.app'],
    // You might also want to add these for better ngrok compatibility:
    host: true, // Listen on all addresses
    port: 5173, // Your Vite port
    strictPort: true, // Don't try other ports if 5173 is taken
  },
});