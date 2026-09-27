import { defineConfig } from "vite";

// Standalone build of the API documentation, deployed separately from the app
export default defineConfig({
  base: process.env.API_DOCS_BASE || "/",
  build: {
    outDir: "build",
    emptyOutDir: true,
    // Scalar is a single large bundle, nothing to gain from splitting it
    chunkSizeWarningLimit: 4000,
  },
  server: {
    port: 3007,
  },
});
