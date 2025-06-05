// vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs'; // Importa el módulo fs
import path from 'path'; // Importa el módulo path

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      outDir: 'dist',
      manifest: {
        name: 'Mi App de Finanzas Zenithtrack',
        short_name: 'Zenith',
        description: 'Tu App de Elegancia , Control y Minimalismo',
        theme_color: '#007bff',
        background_color: '#ffffff',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg}']
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Permite acceso desde otras máquinas en la red local
    port: 5174,
    https: { // Añade esta sección para HTTPS
      key: fs.readFileSync(path.resolve(__dirname, '.certs/localhost+2-key.pem')), // Ajusta la ruta y nombre si es diferente
      cert: fs.readFileSync(path.resolve(__dirname, '.certs/localhost+2.pem'))    // Ajusta la ruta y nombre si es diferente
    }
  }
});