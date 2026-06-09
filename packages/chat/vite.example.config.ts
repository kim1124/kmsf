import { resolve } from "node:path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: resolve(import.meta.dirname, "example"),
  server: {
    host: "127.0.0.1",
    port: 4014,
    strictPort: false,
  },
});
