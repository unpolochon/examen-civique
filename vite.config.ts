/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative base: the app is served from a GitHub Pages sub-path.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeManifestIcons: false, // already matched by globPatterns
      manifest: {
        name: 'Civique - examen carte de résident',
        short_name: 'Civique',
        description: 'Examen blanc, leçons et cartes de révision pour l’examen civique de la carte de résident.',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#F2F3F7', // the screen background: the status bar blends in, as in the mockups
        background_color: '#F2F3F7',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,md,woff2}'],
        // Google Fonts are cross-origin: cache them on first visit for offline use (FR-002).
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
  },
})
