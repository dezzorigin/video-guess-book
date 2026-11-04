import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'fonts/*'],
      // Manifest diserve statis dari public/manifest.webmanifest
      // (satu-satunya sumber; valid juga saat npm run dev).
      // Service worker HANYA aktif di hasil build, tidak di dev server.
      devOptions: {
        enabled: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      }
    })
  ]
});