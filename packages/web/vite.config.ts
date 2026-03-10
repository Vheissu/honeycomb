import { defineConfig } from 'vite';
import aurelia from '@aurelia/vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  envDir: '../../',
  server: {
    open: !process.env.CI,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  esbuild: { target: 'es2022' },
  plugins: [
    aurelia({ useDev: true }),
    tailwindcss(),
  ],
});
