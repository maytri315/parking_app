import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Optional: If your backend is on a different port, you might need a proxy
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // Your Flask backend URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      // You might need to add other backend routes here if they don't start with /api
    },
    // Ensure the port matches what you prefer, or let Vite pick one
    // port: 5173, // Default Vite port
  }
})