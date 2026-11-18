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
      // Manifest HARUS dideklarasikan di sini: tanpa opsi manifest,
      // vite-plugin-pwa menimpa public/manifest.webmanifest dengan manifest
      // minimal hasil generate (nama "openwedding", tanpa ikon) — itulah
      // yang selama ini ter-deploy. Isi di bawah ini cerminan persis
      // public/manifest.webmanifest (satu-satunya sumber saat dev).
      manifest: {
        name: 'OpenWedding',
        short_name: 'OpenWedding',
        description: 'Video guestbook offline-first untuk pernikahan & event spesial',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#FAF6E9',
        theme_color: '#1D1D1B',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' }
        ]
      },
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