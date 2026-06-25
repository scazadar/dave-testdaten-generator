// Plugins
import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
// Utilities
import { defineConfig } from "vite";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
      styles: {
        configFile: "src/styles/settings.scss",
      },
    }),
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  server: {
    // 8090, um nicht mit dem DAVe-Frontend (8082) zu kollidieren
    port: 8090,
    proxy: {
      // Leitet API-Aufrufe im Dev-Modus an das DAVe-Backend weiter und strippt
      // den Gateway-Präfix (analog zu nginx im Container). Backend-URL via
      // VITE_DAVE_BACKEND überschreibbar, Default localhost:50001.
      "/api/dave-backend-service": {
        target: process.env.VITE_DAVE_BACKEND ?? "http://localhost:50001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dave-backend-service/, ""),
      },
    },
  },
});
