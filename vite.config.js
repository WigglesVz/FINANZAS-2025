// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  // No se necesitan plugins adicionales para Vite por defecto para este problema.
  // Las configuraciones de build y optimizeDeps son las áreas a considerar.
  // Por ahora, empecemos con un config casi vacío para ver si solo tenerlo
  // ayuda a Vite a hacer un análisis más profundo o si necesitamos añadir algo.
  build: {
    // Opciones de build si fueran necesarias más adelante
  },
  // optimizeDeps: { // Esto es principalmente para el servidor de desarrollo,
                  // pero a veces puede influir en cómo se tratan las dependencias.
  //   include: ['dexie'],
  // }
});