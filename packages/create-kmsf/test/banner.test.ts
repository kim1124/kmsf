import { describe, it, expect } from "vitest";
import { renderBanner } from "../src/banner";

describe("renderBanner", () => {
  it("includes KMSF brand and version", () => {
    const out = renderBanner({ version: "0.1.0", color: false });
    expect(out).toContain("KMSF");
    expect(out).toContain("0.1.0");
  });

  it("emits multi-line banner", () => {
    const out = renderBanner({ version: "1.0.0", color: false });
    expect(out.split("\n").length).toBeGreaterThan(1);
  });

  it("color=false produces no ANSI escapes", () => {
    const out = renderBanner({ version: "0.1.0", color: false });
    expect(out).not.toMatch(/\[/);
  });
});
