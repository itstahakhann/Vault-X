import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Important for Electron: relative asset URLs so that when the
  // renderer loads dist/index.html via file://, references like
  // "./assets/main-abc123.js" resolve inside the app folder instead
  // of pointing at the filesystem root.
  base: './',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});