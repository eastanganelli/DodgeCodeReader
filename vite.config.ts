import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// BASE_PATH lets CI build for https://<user>.github.io/<repo>/ ; default './' works on any host/subfolder.
const base = process.env.BASE_PATH || './';

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Dodge Code Reader',
        short_name: 'Dodge Codes',
        description: 'Read Chrysler/Dodge check-engine flash codes from a video of the dashboard lamp.',
        lang: 'es',
        start_url: base,
        scope: base,
        id: base,
        display: 'standalone',
        orientation: 'any',
        background_color: '#f6f1e7',
        theme_color: '#f2b705',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
      },
    }),
  ],
});
