import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("../../src/styles.css", import.meta.url)), "utf8");

describe("@kmsf/gridstack typography contract", () => {
  it("uses the shared KMSF typography tokens in widget chrome", () => {
    expect(css).toContain("--kmsf-font-family-base");
    expect(css).toContain("--kmsf-font-size-base");
    expect(css).toContain("font-family: var(--kmsf-font-family-base");
    expect(css).toContain("font-size: var(--kmsf-font-size-base");
  });
});
