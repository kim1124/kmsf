import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  bodyFontStack,
  displayFontStack,
} from "../templates/next-app-base/src/lib/theme/font-stacks.js";

const templateRoot = join(process.cwd(), "templates/next-app-base");
const css = readFileSync(join(templateRoot, "src/app/globals.css"), "utf8");

describe("next app template typography contract", () => {
  it("uses Spoqa Han Sans Neo before system fallbacks", () => {
    expect(bodyFontStack.startsWith("\"Spoqa Han Sans Neo\"")).toBe(true);
    expect(bodyFontStack).toContain("\"SpoqaHanSans\"");
    expect(displayFontStack).toBe(bodyFontStack);
  });

  it("loads local Spoqa Han Sans Neo webfont files and exposes the shared class", () => {
    expect(css).toContain("@font-face");
    expect(css).toContain("font-family: \"Spoqa Han Sans Neo\"");
    expect(css).toContain("--kmsf-font-size-base: 12px");
    expect(css).toContain(".kmsf-typography-base");
    expect(existsSync(join(templateRoot, "public/fonts/spoqa/SpoqaHanSansNeo-Regular.woff2"))).toBe(true);
    expect(existsSync(join(templateRoot, "public/fonts/spoqa/SpoqaHanSansNeo-Medium.woff2"))).toBe(true);
    expect(existsSync(join(templateRoot, "public/fonts/spoqa/SpoqaHanSansNeo-Bold.woff2"))).toBe(true);
  });
});
