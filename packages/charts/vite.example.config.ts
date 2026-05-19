import { defineConfig } from "vite";

const port = Number(process.env.KMSF_CHARTS_PORT ?? process.env.PORT ?? 4000);

export default defineConfig({
  root: "example",
  server: {
    host: "127.0.0.1",
    port,
    strictPort: true,
  },
});
