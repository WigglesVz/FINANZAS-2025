// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['dexie'],
  }
  // Puedes añadir la sección 'build' si es necesario más adelante
  // build: {
  //   rollupOptions: {
  //     // ...
  //   }
  // }
});