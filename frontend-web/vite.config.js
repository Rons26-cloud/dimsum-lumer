import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

function createSecurityHeaders(isDevelopment = false) {
  const scriptSrc = isDevelopment
    ? "script-src 'self' 'unsafe-inline' https://maps.googleapis.com"
    : "script-src 'self' https://maps.googleapis.com";
  return {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Permitted-Cross-Domain-Policies": "none",
  "X-DNS-Prefetch-Control": "off",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Content-Security-Policy": `default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://*.openstreetmap.org; frame-src 'self' https://www.google.com https://maps.google.com https://www.openstreetmap.org; worker-src 'self' blob:; upgrade-insecure-requests`,
  };
};

// Frontend Web — dikonfigurasi sebagai PWA agar terasa & bisa diinstall
export default defineConfig(({ command }) => {
  const isDevelopment = command === "serve";
  return {
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "icon-192.png", "apple-touch-icon.png", "favicon.ico", "favicon-32.png", "favicon-16.png"],
      manifest: {
        name: "Dimsum Lumer",
        short_name: "Dimsum Lumer",
        description: "Pesan dimsum lumer favoritmu, anytime, anywhere.",
        theme_color: "#FF7A00",
        background_color: "#FFF8F2",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "logo.png", sizes: "512x512", type: "image/png" },
          { src: "logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,ico}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "dimsum-lumer-images",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    cors: false,
    fs: { strict: true },
    headers: createSecurityHeaders(isDevelopment),
  },
  preview: {
    host: "127.0.0.1",
    strictPort: true,
    headers: createSecurityHeaders(false),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom", "zustand"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
  };
});
