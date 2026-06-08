import { describe, expect, it } from "vitest";

import { bodyFontStack, displayFontStack, monoFontStack } from "./font-stacks";

describe("font stacks", () => {
  it("use Spoqa Han Sans Neo before system fallbacks", () => {
    expect(bodyFontStack.startsWith("\"Spoqa Han Sans Neo\"")).toBe(true);
    expect(bodyFontStack).toContain("\"SpoqaHanSans\"");
    expect(bodyFontStack).toContain("\"Apple SD Gothic Neo\"");
    expect(bodyFontStack).toContain("\"Malgun Gothic\"");
    expect(bodyFontStack).toContain("\"Segoe UI\"");
  });

  it("keep headings on the same cross-platform sans family", () => {
    expect(displayFontStack).toBe(bodyFontStack);
  });

  it("use a browser-safe monospace stack", () => {
    expect(monoFontStack).toContain("ui-monospace");
    expect(monoFontStack).toContain("\"SFMono-Regular\"");
    expect(monoFontStack).toContain("Consolas");
    expect(monoFontStack).toContain("monospace");
  });
});
