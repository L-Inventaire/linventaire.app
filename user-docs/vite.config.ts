import { defineConfig } from "vite";

// Standalone build of the user manual, served under /manuals of the frontend
export default defineConfig({
  base: process.env.USER_DOCS_BASE || "/",
  build: {
    outDir: "build",
    emptyOutDir: true,
    // Scalar is a single large bundle, nothing to gain from splitting it
    chunkSizeWarningLimit: 4000,
  },
  server: {
    port: 3008,
  },
});
