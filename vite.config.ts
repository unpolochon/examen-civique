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
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#5B5BD6',
        background_color: '#F2F3F7',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,md,woff2}'],
      },
    }),
  ],
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
  },
})
