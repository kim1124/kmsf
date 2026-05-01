import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { copyDir } from "../src/copy";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "kmsf-copy-test-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

async function setupSource(): Promise<string> {
  const src = path.join(workDir, "src");
  await mkdir(src, { recursive: true });
  await mkdir(path.join(src, "sub"), { recursive: true });
  await mkdir(path.join(src, "node_modules"), { recursive: true });
  await writeFile(path.join(src, "a.txt"), "A");
  await writeFile(path.join(src, "sub", "b.txt"), "B");
  await writeFile(path.join(src, "node_modules", "skip.txt"), "skip");
  return src;
}

describe("copyDir", () => {
  it("copies all files when no excludes", async () => {
    const src = await setupSource();
    const dst = path.join(workDir, "dst");
    const result = await copyDir(src, dst, { exclude: [] });

    expect(result.fileCount).toBe(3);
    expect(await readFile(path.join(dst, "a.txt"), "utf8")).toBe("A");
    expect(await readFile(path.join(dst, "sub", "b.txt"), "utf8")).toBe("B");
  });

  it("skips files matching exclude glob", async () => {
    const src = await setupSource();
    const dst = path.join(workDir, "dst");
    const result = await copyDir(src, dst, { exclude: ["node_modules/**"] });

    expect(result.fileCount).toBe(2);
    const dstFiles = await readdir(dst);
    expect(dstFiles).not.toContain("node_modules");
  });

  it("creates target directory if missing", async () => {
    const src = await setupSource();
    const dst = path.join(workDir, "deep", "nested", "dst");
    const result = await copyDir(src, dst, { exclude: [] });
    expect(result.fileCount).toBe(3);
  });

  it("supports multiple exclude patterns", async () => {
    const src = await setupSource();
    const dst = path.join(workDir, "dst");
    const result = await copyDir(src, dst, {
      exclude: ["node_modules/**", "**/*.txt"],
    });
    expect(result.fileCount).toBe(0);
  });
});
