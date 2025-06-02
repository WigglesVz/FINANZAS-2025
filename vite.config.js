import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa'; // <--- ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ AHÍ

export default defineConfig({
  plugins: [
    // Otros plugins que ya tengas aquí (ej. react(), vue(), etc.)
    VitePWA({ // <--- ASEGÚRATE DE QUE ESTE BLOQUE ESTÉ CORRECTO Y COMPLETO
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
            src: '/pwa-192x192.png', // Ruta del icono desde la raíz (porque está en /public/)
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png', // Si tienes otro icono de 512x512
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png', // Icono para Android adaptable (opcional, pero buena práctica)
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
    host: '0.0.0.0',
    port: 5174
  }
});