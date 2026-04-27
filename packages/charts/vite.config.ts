import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      name: "KmsfCharts",
    },
    rollupOptions: {
      external: ["react", "react-dom", "echarts", "dayjs", "echarts-wordcloud"],
    },
    sourcemap: true,
  },
});
