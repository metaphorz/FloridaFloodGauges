import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Florida Flood Gauge Monitor',
        short_name: 'FL Flood',
        description: 'Real-time USGS flood gauge data for Florida rivers and streams',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/waterservices\.usgs\.gov\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'usgs-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  base: '/FloridaFloodGauges/',
  // Vite automatically exposes environment variables prefixed with VITE_
  // from .env.local in the project root
});
