import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import os from "node:os";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  // Keep the dep-optimizer cache off OneDrive — its sync lock races esbuild writes.
  cacheDir: path.join(os.tmpdir(), "newsdeck-vite-cache"),
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
