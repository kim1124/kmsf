import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const publicRoot = join(process.cwd(), "public");

describe("global typography contract", () => {
  it("loads local Spoqa Han Sans Neo webfont files", () => {
    expect(css).toContain("@font-face");
    expect(css).toContain("font-family: \"Spoqa Han Sans Neo\"");
    expect(css).toContain("/fonts/spoqa/SpoqaHanSansNeo-Regular.woff2");
    expect(css).toContain("/fonts/spoqa/SpoqaHanSansNeo-Medium.woff2");
    expect(css).toContain("/fonts/spoqa/SpoqaHanSansNeo-Bold.woff2");

    expect(existsSync(join(publicRoot, "fonts/spoqa/SpoqaHanSansNeo-Regular.woff2"))).toBe(true);
    expect(existsSync(join(publicRoot, "fonts/spoqa/SpoqaHanSansNeo-Medium.woff2"))).toBe(true);
    expect(existsSync(join(publicRoot, "fonts/spoqa/SpoqaHanSansNeo-Bold.woff2"))).toBe(true);
  });

  it("exposes the shared typography class and base size token", () => {
    expect(css).toContain("--kmsf-font-size-base: 12px");
    expect(css).toContain(".kmsf-typography-base");
    expect(css).toContain("font-size: var(--kmsf-font-size-base)");
    expect(css).toContain("font-family: var(--kmsf-font-family-base)");
  });
});
