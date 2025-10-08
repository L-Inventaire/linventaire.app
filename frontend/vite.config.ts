import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "linventaireapp",
      project: "linventaire-front",
    }),
  ],
  server: {
    port: 3006,
    open: true,
  },
  build: {
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/themes", "@headlessui/react"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@views": path.resolve(__dirname, "./src/views"),
      "@atoms": path.resolve(__dirname, "./src/atoms"),
      "@molecules": path.resolve(__dirname, "./src/molecules"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  define: {
    // Compatibilité avec les variables d'environnement React
    "process.env": process.env,
  },
  css: {
    postcss: {
      plugins: [require("tailwindcss")],
    },
  },
});
