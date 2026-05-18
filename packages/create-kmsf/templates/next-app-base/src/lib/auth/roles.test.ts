import { describe, expect, it } from "vitest";

import { normalizeRole } from "./roles";

describe("normalizeRole", () => {
  it("returns admin for admin", () => {
    expect(normalizeRole("admin")).toBe("admin");
  });

  it("falls back to member for unknown roles", () => {
    expect(normalizeRole("guest")).toBe("member");
  });
});
