import { describe, expect, it } from "vitest";

import {
  formatSystemResetErrorRoute,
  formatSystemResetSuccessRoute,
  getSystemResetConfirmation,
  isSystemResetConfirmationValid,
  normalizeSystemResetMode,
} from "./system-reset";

describe("system reset routes", () => {
  it("formats reset error redirects with the reset settings section", () => {
    expect(formatSystemResetErrorRoute("auth")).toBe(
      "/settings?section=reset&systemResetError=auth",
    );
    expect(formatSystemResetErrorRoute("reset")).toBe(
      "/settings?section=reset&systemResetError=reset",
    );
  });

  it("uses mode-specific reset confirmation text", () => {
    expect(getSystemResetConfirmation("factory")).toBe("공장초기화");
    expect(getSystemResetConfirmation("settings")).toBe("설정초기화");
    expect(isSystemResetConfirmationValid("factory", "공장초기화")).toBe(true);
    expect(isSystemResetConfirmationValid("settings", "설정초기화")).toBe(true);
    expect(isSystemResetConfirmationValid("factory", "초기화")).toBe(false);
  });

  it("normalizes reset mode with factory as the safe default", () => {
    expect(normalizeSystemResetMode("settings")).toBe("settings");
    expect(normalizeSystemResetMode("factory")).toBe("factory");
    expect(normalizeSystemResetMode("invalid")).toBe("factory");
    expect(normalizeSystemResetMode(null)).toBe("factory");
  });

  it("formats reset success redirects by mode", () => {
    expect(formatSystemResetSuccessRoute("factory")).toBe("/setup/initial-admin?reset=success");
    expect(formatSystemResetSuccessRoute("settings")).toBe("/sign-in?success=settings-reset");
  });
});
