import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const packageRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(packageRoot, path), "utf8")) as T;
}

describe("@kmsf/chat package contract", () => {
  it("declares the package metadata, exports, and verification scripts", () => {
    const pkg = readJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      exports?: Record<string, unknown>;
      name?: string;
      peerDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
      sideEffects?: string[];
      type?: string;
    }>("package.json");

    expect(pkg.name).toBe("@kmsf/chat");
    expect(pkg.type).toBe("module");
    expect(pkg.exports).toMatchObject({
      ".": {
        import: "./dist/index.js",
        types: "./dist/index.d.ts",
      },
      "./styles.css": "./dist/styles.css",
    });
    expect(pkg.sideEffects).toContain("./dist/styles.css");
    expect(pkg.peerDependencies).toMatchObject({
      react: ">=18.0.0 <20.0.0",
      "react-dom": ">=18.0.0 <20.0.0",
    });
    expect(pkg.dependencies).toHaveProperty("lucide-react");
    expect(pkg.devDependencies).toMatchObject({
      "@playwright/test": expect.any(String),
      "@tailwindcss/postcss": expect.any(String),
      "@vitejs/plugin-react": expect.any(String),
      tailwindcss: expect.any(String),
      typescript: expect.any(String),
      vite: expect.any(String),
      vitest: expect.any(String),
    });
    expect(pkg.scripts).toMatchObject({
      build: "vite build && tsc -p tsconfig.build.json && cp src/styles.css dist/styles.css",
      lint: "tsc --noEmit",
      "test:e2e": "env -u NO_COLOR playwright test --config=playwright.config.ts",
      "test:run": "vitest run",
      verify: "npm run lint && npm run test:run && npm run build",
      "verify:full": "npm run verify && npm run test:e2e",
    });
  });
});
