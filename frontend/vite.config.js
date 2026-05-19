import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = 'http://localhost:5000';
const proxyPaths = ['/auth', '/patients', '/staff', '/appointments', '/prescriptions', '/ai', '/analytics'];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: Object.fromEntries(
      proxyPaths.map((path) => [path, { target: backend, changeOrigin: true }])
    ),
  },
});
