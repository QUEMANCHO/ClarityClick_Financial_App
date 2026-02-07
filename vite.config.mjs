import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({ plugins: [tailwindcss(), VitePWA({ registerType: 'autoUpdate', injectRegister: 'auto', includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], manifest: { name: 'ClarityClick', short_name: 'ClarityClick', description: 'Tu asesor financiero inteligente', theme_color: '#ffffff', background_color: '#ffffff', display: 'standalone', start_url: '/', icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }, { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }] }, devOptions: { enabled: true } })], });
