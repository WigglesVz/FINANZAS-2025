// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const httpsConfig = mode === 'development'
    ? {
        key: fs.readFileSync(path.resolve(__dirname, '.certs/localhost+2-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, '.certs/localhost+2.pem'))
      }
    : undefined;

  return {
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        outDir: 'dist',
        manifest: {
          name: 'Zenithtrack App',
          short_name: 'Zenith',
          description: 'Tu App de Elegancia, Control y Minimalismo',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg}']
        }
      })
    ],
    server: {
      host: '0.0.0.0',
      port: 5174,
      https: httpsConfig
    },
    build: {
      rollupOptions: {
        // Esta opción puede ser necesaria si el plugin de PWA sigue dando problemas.
        // La dejamos aquí por si acaso.
        external: [] 
      }
    }
  };
});