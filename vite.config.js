import { defineConfig } from 'vite';

export default defineConfig({
  // No se necesita configuración especial para Dexie por defecto,
  // pero si el problema persiste, podrías intentar forzar su pre-empaquetado,
  // aunque esto es más para el servidor de desarrollo.
  // optimizeDeps: {
  //   include: ['dexie'],
  // },
  // build: {
  //   // Opciones de build si fueran necesarias
  // }
});