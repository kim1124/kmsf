import { describe, it, expect } from "vitest";
import {
  InvalidProjectNameError,
  TargetExistsError,
  TemplateMissingError,
  CopyFailedError,
} from "../src/errors.js";

describe("error classes", () => {
  it("InvalidProjectNameError carries name", () => {
    const e = new InvalidProjectNameError("Bad Name", "must be lowercase");
    expect(e.code).toBe("InvalidProjectName");
    expect(e.message).toContain("Bad Name");
    expect(e.message).toContain("lowercase");
  });

  it("TargetExistsError has path", () => {
    const e = new TargetExistsError("/tmp/foo");
    expect(e.code).toBe("TargetExists");
    expect(e.path).toBe("/tmp/foo");
  });

  it("TemplateMissingError uses code", () => {
    const e = new TemplateMissingError("/tmp/templates");
    expect(e.code).toBe("TemplateMissing");
  });

  it("CopyFailedError wraps cause", () => {
    const cause = new Error("EACCES");
    const e = new CopyFailedError(cause);
    expect(e.code).toBe("CopyFailed");
    expect(e.cause).toBe(cause);
  });
});
