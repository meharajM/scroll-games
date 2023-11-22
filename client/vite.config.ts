import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*'],
      },
      includeAssets: ['**/*'],
      manifest: {
        theme_color: '#6100FF',
        background_color: '#FFFFFF',
        display: 'browser',
        scope: '/',
        start_url: '/',
        name: 'scroll-games',
        short_name: 'scroll-gmaes',
        // icons: [
        //   {
        //     src: './icons/icon-192x192.png',
        //     sizes: '192x192',
        //     type: 'image/png',
        //   },
        //   {
        //     src: './icons/icon-256x256.png',
        //     sizes: '256x256',
        //     type: 'image/png',
        //   },
        //   {
        //     src: './icons/icon-384x384.png',
        //     sizes: '384x384',
        //     type: 'image/png',
        //   },
        //   {
        //     src: './icons/icon-512x512.png',
        //     sizes: '512x512',
        //     type: 'image/png',
        //   },
        // ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/Games':  'http://localhost:3000',
    },
  },
})
