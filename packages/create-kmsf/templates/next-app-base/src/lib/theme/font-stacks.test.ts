import { describe, expect, it } from "vitest";

import { bodyFontStack, displayFontStack, monoFontStack } from "./font-stacks";

describe("font stacks", () => {
  it("use system-first sans fonts that cover Korean and English", () => {
    expect(bodyFontStack).toContain("system-ui");
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
