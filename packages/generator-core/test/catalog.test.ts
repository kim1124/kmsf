import { describe, it, expect } from "vitest";
import { TEMPLATE_CATALOG, getTemplate } from "../src/catalog.js";

describe("catalog", () => {
  it("exposes next-app-base template", () => {
    expect(TEMPLATE_CATALOG["next-app-base"]).toBeDefined();
  });

  it("getTemplate returns the entry by id", () => {
    const t = getTemplate("next-app-base");
    expect(t.id).toBe("next-app-base");
    expect(t.relativePath).toBe("templates/next-app-base");
    expect(t.supportedAuthModes).toEqual(["local-json", "supabase", "none"]);
  });

  it("getTemplate throws on unknown id", () => {
    expect(() => getTemplate("missing" as never)).toThrow(/unknown template/i);
  });
});
