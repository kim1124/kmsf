import { describe, expect, it } from "vitest";

import { formatSystemResetErrorRoute, formatSystemResetSuccessRoute } from "./system-reset";

describe("system reset routes", () => {
  it("formats reset error redirects with the reset settings section", () => {
    expect(formatSystemResetErrorRoute("auth")).toBe(
      "/settings?section=reset&systemResetError=auth",
    );
    expect(formatSystemResetErrorRoute("reset")).toBe(
      "/settings?section=reset&systemResetError=reset",
    );
  });

  it("formats the factory reset success redirect to initial admin setup", () => {
    expect(formatSystemResetSuccessRoute()).toBe("/setup/initial-admin?reset=success");
  });
});
