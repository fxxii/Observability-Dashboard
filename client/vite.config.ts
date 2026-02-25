import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/events': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
      '/stream': { target: 'ws://localhost:4000', ws: true },
    },
  },
});
