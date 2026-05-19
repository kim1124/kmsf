import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const port = Number(process.env.KMSF_GRIDSTACK_PORT ?? process.env.PORT ?? 6000);

export default defineConfig({
  plugins: [react()],
  root: "example",
  server: {
    host: "127.0.0.1",
    port,
    strictPort: true,
  },
});
