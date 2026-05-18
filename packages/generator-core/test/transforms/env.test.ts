import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { generateEnvLocal } from "../../src/transforms/env.js";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "kmsf-env-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

const SAMPLE_EXAMPLE = `
# Application
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000

# Auth provider mode: "supabase" | "local-json" | "none"
KMSF_AUTH_PROVIDER=local-json

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Local JSON auth
KMSF_LOCAL_AUTH_DB_PATH=./.local/auth.db.json
KMSF_LOCAL_AUTH_SESSION_SECRET=replace-me-with-a-long-random-string
`.trim();

async function setupExample(): Promise<void> {
  await writeFile(path.join(workDir, ".env.example"), SAMPLE_EXAMPLE);
}

describe("generateEnvLocal", () => {
  it("creates .env.local from .env.example with provider override", async () => {
    await setupExample();
    const result = await generateEnvLocal(workDir, { authMode: "supabase" });
    const content = await readFile(path.join(workDir, ".env.local"), "utf8");
    expect(content).toContain("KMSF_AUTH_PROVIDER=supabase");
    expect(content).toContain("NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000");
    expect(result.created).toBe(true);
  });

  it("generates random session secret in local-json mode", async () => {
    await setupExample();
    await generateEnvLocal(workDir, { authMode: "local-json" });
    const content = await readFile(path.join(workDir, ".env.local"), "utf8");
    expect(content).toMatch(/KMSF_LOCAL_AUTH_SESSION_SECRET=[a-f0-9]{32,}/);
    expect(content).not.toContain("replace-me-with-a-long-random-string");
  });

  it("skips when .env.local already exists", async () => {
    await setupExample();
    await writeFile(path.join(workDir, ".env.local"), "EXISTING=1");
    const result = await generateEnvLocal(workDir, { authMode: "none" });
    expect(result.created).toBe(false);
    expect(result.skippedReason).toBe("already exists");
    expect(await readFile(path.join(workDir, ".env.local"), "utf8")).toBe("EXISTING=1");
  });

  it("throws if .env.example is missing", async () => {
    await expect(generateEnvLocal(workDir, { authMode: "none" })).rejects.toThrow(/\.env\.example/);
  });

  it("sets none mode and leaves auth keys blank", async () => {
    await setupExample();
    await generateEnvLocal(workDir, { authMode: "none" });
    const content = await readFile(path.join(workDir, ".env.local"), "utf8");
    expect(content).toContain("KMSF_AUTH_PROVIDER=none");
  });
});
