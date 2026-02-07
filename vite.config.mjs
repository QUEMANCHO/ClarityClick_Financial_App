import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: null, // Defer to manual registration in main.tsx
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                id: '/',
                name: 'ClarityClick',
                short_name: 'ClarityClick',
                description: 'Tu asesor financiero inteligente',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                screenshots: [
                    {
                        src: "https://placehold.co/1080x1920/png?text=ClarityClick+Dashboard",
                        sizes: "1080x1920",
                        type: "image/png",
                        form_factor: "narrow",
                        label: "Dashboard Principal"
                    },
                    {
                        src: "https://placehold.co/1080x1920/png?text=ClarityClick+Transactions",
                        sizes: "1080x1920",
                        type: "image/png",
                        form_factor: "narrow",
                        label: "Registro de Movimientos"
                    },
                    {
                        src: "https://placehold.co/1920x1080/png?text=ClarityClick+Desktop",
                        sizes: "1920x1080",
                        type: "image/png",
                        form_factor: "wide",
                        label: "Vista de Escritorio"
                    }
                ]
            },
            workbox: {
                clientsClaim: true,
                skipWaiting: true
            },
            devOptions: {
                enabled: true
            }
        })
    ],
});
