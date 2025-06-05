// vite.config.js
import { defineConfig, loadEnv } from 'vite'; // Asegúrate de importar loadEnv si lo usas para otras cosas, o solo defineConfig
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => { // mode es 'development' o 'production'
  // Opcional: Cargar variables de entorno específicas del modo si las necesitas para otras cosas
  // const env = loadEnv(mode, process.cwd(), '');

  const httpsConfig = mode === 'development'
    ? {
        key: fs.readFileSync(path.resolve(__dirname, '.certs/localhost+2-key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, '.certs/localhost+2.pem'))
      }
    : undefined; // o false, o simplemente no incluir la propiedad https

  return {
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
      // Otros plugins que ya tengas aquí
    ],
    server: {
      host: '0.0.0.0',
      port: 5174,
      https: httpsConfig // Usar la configuración condicional
    }
    // No necesitas la configuración de 'build' aquí si Netlify usa tu 'npm run build' por defecto.
    // Si necesitas definir 'base' u otras opciones de build, puedes hacerlo aquí.
  };
});