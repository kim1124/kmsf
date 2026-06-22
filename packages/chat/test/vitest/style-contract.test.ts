import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("chat style contract", () => {
  const scss = readFileSync(resolve(process.cwd(), "src/styles/index.scss"), "utf8");

  it("defines chat tokens from KMSF root tokens", () => {
    const tokens = readFileSync(resolve(process.cwd(), "src/styles/_tokens.scss"), "utf8");

    expect(tokens).toContain("--kmsf-chat-background: var(--kmsf-color-background");
    expect(tokens).toContain("--kmsf-chat-accent: var(--kmsf-color-accent");
    expect(tokens).toContain("--kmsf-chat-radius: var(--kmsf-radius-md");
  });

  it("keeps package CSS free from app-only Tailwind utility selectors", () => {
    expect(scss).toContain('@use "tokens"');
    expect(scss).toContain('@use "sidebar"');
    expect(scss).toContain('@use "composer"');
    expect(scss).not.toContain(".bg-emerald-");
    expect(scss).not.toContain(".text-slate-");
  });
});
