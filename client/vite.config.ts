import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Identifies the default local origin exposed by `wrangler dev`. */
const localWorkerOrigin = 'http://127.0.0.1:8787';

/** Mirrors the production Worker routing when the Vite development server is used. */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: localWorkerOrigin,
        changeOrigin: true,
      },
    },
  },
});
