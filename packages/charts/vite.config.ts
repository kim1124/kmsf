import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es"],
      name: "KmsfCharts",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "echarts", "dayjs", "echarts-wordcloud"],
    },
    sourcemap: true,
  },
});
