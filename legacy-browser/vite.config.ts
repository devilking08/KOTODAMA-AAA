import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173, host: '0.0.0.0' },
  preview: { port: 4173, host: '0.0.0.0' },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined),
      },
    },
  },
});
