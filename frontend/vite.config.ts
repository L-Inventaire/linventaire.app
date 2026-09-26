import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
      "@shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  define: {
    // Only expose NODE_ENV to the bundle. Injecting the whole `process.env`
    // here leaks build-time secrets (e.g. SENTRY_AUTH_TOKEN) into the client
    // bundle. The app source does not read process.env directly; this only
    // satisfies dependencies that branch on process.env.NODE_ENV.
    "process.env.NODE_ENV": JSON.stringify(mode),
    "process.env": "{}",
  },
  css: {
    postcss: {
      plugins: [require("tailwindcss")],
    },
  },
}));
