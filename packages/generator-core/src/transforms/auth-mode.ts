import { rm, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuthMode } from "../types.js";

/** Paths to remove for each auth mode (relative to project root). */
const REMOVAL_MAP: Record<AuthMode, string[]> = {
  "local-json": [
    "src/lib/supabase",
    "src/lib/auth/google-identity.ts",
    "src/lib/auth/google-identity.test.ts",
    "src/app/auth/callback",
  ],
  supabase: [
    "src/lib/auth/local-session.server.ts",
    "src/lib/auth/local-session.server.test.ts",
    "src/lib/auth/providers/local-json-auth-store.ts",
    "src/lib/auth/providers/local-json-auth-store.test.ts",
  ],
  none: [
    "src/lib/auth",
    "src/lib/supabase",
    "src/components/auth",
    "src/app/[locale]/(public)",
    "src/app/auth",
    "src/app/api/session",
    "src/app/setup",
  ],
};

const SIGNIN_PAGE_REL = "src/app/[locale]/(public)/sign-in/page.tsx";

/**
 * Strip the Google OAuth form + supabase wiring from sign-in/page.tsx
 * so local-json mode renders a clean username/password-only screen.
 * No-op when the file is missing (e.g. none mode already removed it).
 */
async function stripGoogleSignIn(projectRoot: string): Promise<void> {
  const filePath = path.join(projectRoot, SIGNIN_PAGE_REL);
  let content: string;
  try {
    content = await readFile(filePath, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
    throw e;
  }

  // Drop the imports that only exist for the Google flow.
  content = content
    .replace(/import\s+\{\s*signInWithGoogleAction\s*\}\s+from\s+["'][^"']+["'];\s*\n/g, "")
    .replace(/import\s+\{\s*GoogleMark\s*\}\s+from\s+["'][^"']+["'];\s*\n/g, "")
    .replace(/import\s+\{\s*isSupabaseConfigured\s*\}\s+from\s+["'][^"']+["'];\s*\n/g, "")
    .replace(/\s*const\s+supabaseReady\s*=\s*isSupabaseConfigured\(\);\s*\n/g, "\n");

  // Drop the entire Google form block.
  content = content.replace(
    /\s*<form\s+action=\{signInWithGoogleAction\}[\s\S]*?<\/form>\s*\n/g,
    "",
  );

  await writeFile(filePath, content, "utf8");
}

export async function applyAuthMode(projectRoot: string, mode: AuthMode): Promise<void> {
  const removals = REMOVAL_MAP[mode];
  for (const rel of removals) {
    const full = path.join(projectRoot, rel);
    await rm(full, { recursive: true, force: true });
  }

  // local-json: scrub Google OAuth references from sign-in page
  if (mode === "local-json") {
    await stripGoogleSignIn(projectRoot);
  }
}
