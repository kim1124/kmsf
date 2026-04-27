import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kmsf/charts", "@kmsf/data-table", "@kmsf/gridstack"],
};

export default nextConfig;
