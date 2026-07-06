import { describe, it, expect } from "vitest";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, "..");

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readPackageJson(): Promise<{
  dependencies?: Record<string, string>;
  files?: string[];
  scripts?: Record<string, string>;
}> {
  return JSON.parse(await readFile(path.join(PACKAGE_ROOT, "package.json"), "utf8"));
}

describe("external package contract", () => {
  it("does not depend on internal workspace packages at runtime", async () => {
    const pkg = await readPackageJson();

    expect(pkg.dependencies ?? {}).not.toHaveProperty("@kmsf/generator-core");
  });

  it("includes templates in package files", async () => {
    const pkg = await readPackageJson();

    expect(pkg.files).toContain("templates");
  });

  it("ships the local KMSF smoke verification script", async () => {
    const pkg = await readPackageJson();

    expect(pkg.files).toContain("scripts");
    expect(pkg.scripts?.["smoke:kmsf"]).toBe("node scripts/smoke-kmsf.mjs");
    expect(await exists(path.join(PACKAGE_ROOT, "scripts/smoke-kmsf.mjs"))).toBe(true);
  });

  it("cleans generated dist before building for pack", async () => {
    const pkg = await readPackageJson();

    expect(pkg.scripts?.build).toMatch(/rmSync\(['"]dist['"]/);
  });

  it("ships the Next.js base template inside create-kmsf", async () => {
    expect(
      await exists(path.join(PACKAGE_ROOT, "templates/next-app-base/package.json")),
    ).toBe(true);
    expect(
      await exists(path.join(PACKAGE_ROOT, "templates/next-app-base/src/app/layout.tsx")),
    ).toBe(true);
  });

  it("ships the React Vite base template inside create-kmsf", async () => {
    expect(
      await exists(path.join(PACKAGE_ROOT, "templates/react-vite-base/package.json")),
    ).toBe(true);
    expect(
      await exists(path.join(PACKAGE_ROOT, "templates/react-vite-base/src/main.tsx")),
    ).toBe(true);
    expect(
      await exists(path.join(PACKAGE_ROOT, "templates/react-vite-base/gitignore")),
    ).toBe(true);
  });

  it("ships npm-safe placeholders for dotfiles ignored by npm pack", async () => {
    expect(
      await exists(path.join(PACKAGE_ROOT, "templates/next-app-base/gitignore")),
    ).toBe(true);
  });
});
