import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      name: "KmsfGridstack",
    },
    rollupOptions: {
      external: ["react", "react-dom", "gridstack", "lucide-react"],
    },
    sourcemap: true,
  },
});
