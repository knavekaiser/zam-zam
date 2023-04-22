import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA()],
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
