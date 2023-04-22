import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "crashpage.webp",
        "avatar.webp",
        // 'robots.txt',
      ],
      registerSW: async ({ swUrl, onUpdate }) => {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.register(swUrl);
          const registration = await navigator.serviceWorker.getRegistration();

          if (registration && onUpdate) {
            registration.addEventListener("updatefound", onUpdate);
          }
        }
      },
      manifest: {
        name: "ZAM-ZAM Tower",
        short_name: "ZAM-ZAM",
        description: "Zam-Zam Tower, Kamrangirchar, Dhaka, Bangladesh",
        theme_color: "#b77cff",
        background_color: "#222222",
        viewport: "width=device-width, initial-scale=1",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "black-translucent",
        icons: [
          {
            src: "/assets/icons/16.png",
            sizes: "16x16",
            type: "image/png",
          },
          {
            src: "/assets/icons/32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "/assets/icons/180.png",
            sizes: "180x180",
            type: "image/png",
          },
          {
            src: "/assets/icons/192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/assets/icons/512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        sourcemap: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^index.html$/],
        /* other options */
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
      Components: "/src/Components",
      config: "/src/config",
      helpers: "/src/helpers",
      hooks: "/src/hooks",
      Views: "/src/Views",
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8050",
        changeOrigin: true,
        secure: false,
      },
      "/assets/uploads": {
        target: "http://localhost:8050",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
