import { describe, expect, it } from "vitest";

import {
  formatServerTimeLabel,
  isNavItemActive,
  normalizeAppPathname,
} from "./app-shell.utils";

describe("normalizeAppPathname", () => {
  it("removes locale prefixes before matching navigation", () => {
    expect(normalizeAppPathname("/ko/settings")).toBe("/settings");
    expect(normalizeAppPathname("/en/dashboard")).toBe("/dashboard");
  });
});

describe("isNavItemActive", () => {
  it("matches exact routes and nested routes without false positives", () => {
    expect(isNavItemActive("/ko/settings", "/settings")).toBe(true);
    expect(isNavItemActive("/settings/profile", "/settings")).toBe(true);
    expect(isNavItemActive("/chart-sample", "/settings")).toBe(false);
  });
});

describe("formatServerTimeLabel", () => {
  it("formats server time with seconds", () => {
    expect(formatServerTimeLabel(new Date(2026, 3, 23, 15, 4, 5))).toBe(
      "현재 시간 : 2026-04-23 15:04:05",
    );
  });
});
