import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwind from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwind()
  ],
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    watch: {
      usePolling: true, // Enable polling for file system watching
      interval: 1000,   // Poll every 1 second
    },
    hmr: {
      port: 5173, // Hot Module Replacement port
    },
    proxy: {
      // any request starting with /api will be forwarded
      "/api": {
        target: "http://corpora-app:8877",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
