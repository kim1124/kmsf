import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { applyAuthMode } from "../../src/transforms/auth-mode";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(path.join(tmpdir(), "kmsf-auth-mode-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

async function exists(relPath: string): Promise<boolean> {
  try {
    await access(path.join(workDir, relPath));
    return true;
  } catch {
    return false;
  }
}

async function setupTree(): Promise<void> {
  await mkdir(path.join(workDir, "src/lib/supabase"), { recursive: true });
  await mkdir(path.join(workDir, "src/lib/auth/providers"), { recursive: true });
  await mkdir(path.join(workDir, "src/components/auth"), { recursive: true });
  await mkdir(path.join(workDir, "src/app/[locale]/(public)/sign-in"), { recursive: true });
  await mkdir(path.join(workDir, "src/app/auth/callback"), { recursive: true });
  await mkdir(path.join(workDir, "src/app/api/session/touch"), { recursive: true });
  await mkdir(path.join(workDir, "src/app/setup/initial-admin"), { recursive: true });

  await writeFile(path.join(workDir, "src/lib/supabase/client.ts"), "");
  await writeFile(path.join(workDir, "src/lib/auth/google-identity.ts"), "");
  await writeFile(path.join(workDir, "src/lib/auth/local-session.server.ts"), "");
  await writeFile(path.join(workDir, "src/lib/auth/providers/local-json-auth-store.ts"), "");
  await writeFile(path.join(workDir, "src/components/auth/sign-in-form.tsx"), "");
  await writeFile(path.join(workDir, "src/app/[locale]/(public)/sign-in/page.tsx"), "");
  await writeFile(path.join(workDir, "src/app/auth/callback/route.ts"), "");
  await writeFile(path.join(workDir, "src/app/api/session/touch/route.ts"), "");
  await writeFile(path.join(workDir, "src/app/setup/initial-admin/page.tsx"), "");
}

describe("applyAuthMode", () => {
  it("local-json: removes supabase + google-identity + auth/callback", async () => {
    await setupTree();
    await applyAuthMode(workDir, "local-json");
    expect(await exists("src/lib/supabase")).toBe(false);
    expect(await exists("src/lib/auth/google-identity.ts")).toBe(false);
    expect(await exists("src/app/auth/callback")).toBe(false);
    expect(await exists("src/lib/auth/local-session.server.ts")).toBe(true);
    expect(await exists("src/lib/auth/providers/local-json-auth-store.ts")).toBe(true);
    expect(await exists("src/components/auth")).toBe(true);
    expect(await exists("src/app/setup/initial-admin")).toBe(true);
  });

  it("local-json: strips Google OAuth form from sign-in page", async () => {
    await setupTree();
    const signInPath = path.join(workDir, "src/app/[locale]/(public)/sign-in/page.tsx");
    await mkdir(path.dirname(signInPath), { recursive: true });
    await writeFile(
      signInPath,
      `import { signInWithGoogleAction } from "@/x";\n` +
        `import { GoogleMark } from "@/y";\n` +
        `import { isSupabaseConfigured } from "@/z";\n` +
        `export default function Page() {\n` +
        `  const supabaseReady = isSupabaseConfigured();\n` +
        `  return (<div>\n` +
        `    <SignInForm />\n` +
        `    <form action={signInWithGoogleAction}>\n` +
        `      <GoogleMark />\n` +
        `      <button disabled={!supabaseReady}>Google</button>\n` +
        `    </form>\n` +
        `  </div>);\n` +
        `}\n`,
    );
    await applyAuthMode(workDir, "local-json");
    const after = await readFile(signInPath, "utf8");
    expect(after).not.toContain("signInWithGoogleAction");
    expect(after).not.toContain("GoogleMark");
    expect(after).not.toContain("isSupabaseConfigured");
    expect(after).not.toContain("<form");
  });

  it("local-json: handles multi-line import block (regression for Q1 follow-up)", async () => {
    // The original sign-in page in apps/kmsf uses a multi-line import block
    // for signInWithGoogleAction AND a separate import from @/lib/supabase/manager.
    // The earlier regex-based stripper missed both. The fix replaces the file
    // wholesale with a known-good local-json variant.
    await setupTree();
    const signInPath = path.join(workDir, "src/app/[locale]/(public)/sign-in/page.tsx");
    await writeFile(
      signInPath,
      `import {\n` +
        `  signInWithGoogleAction,\n` +
        `} from "@/app/[locale]/(public)/sign-in/actions";\n` +
        `import { GoogleMark } from "@/components/auth/_components/google-mark";\n` +
        `import { isSupabaseConfigured } from "@/lib/supabase/env";\n` +
        `import { isInitialSetupRequired } from "@/lib/supabase/manager";\n` +
        `export default function Page() {\n` +
        `  const setupRequired = await isInitialSetupRequired();\n` +
        `  return null;\n` +
        `}\n`,
    );
    await applyAuthMode(workDir, "local-json");
    const after = await readFile(signInPath, "utf8");
    expect(after).not.toContain("signInWithGoogleAction");
    expect(after).not.toContain("GoogleMark");
    expect(after).not.toContain("isSupabaseConfigured");
    expect(after).not.toContain("isInitialSetupRequired");
    expect(after).not.toContain("@/lib/supabase");
    expect(after).toContain("SignInForm");
  });

  it("supabase: removes local-json files only", async () => {
    await setupTree();
    await applyAuthMode(workDir, "supabase");
    expect(await exists("src/lib/auth/local-session.server.ts")).toBe(false);
    expect(await exists("src/lib/auth/providers/local-json-auth-store.ts")).toBe(false);
    expect(await exists("src/lib/supabase/client.ts")).toBe(true);
    expect(await exists("src/lib/auth/google-identity.ts")).toBe(true);
    expect(await exists("src/app/auth/callback")).toBe(true);
  });

  it("none: removes all auth code", async () => {
    await setupTree();
    await applyAuthMode(workDir, "none");
    expect(await exists("src/lib/auth")).toBe(false);
    expect(await exists("src/lib/supabase")).toBe(false);
    expect(await exists("src/components/auth")).toBe(false);
    expect(await exists("src/app/[locale]/(public)")).toBe(false);
    expect(await exists("src/app/auth")).toBe(false);
    expect(await exists("src/app/api/session")).toBe(false);
    expect(await exists("src/app/setup")).toBe(false);
  });
});
