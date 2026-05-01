import { describe, it, expect } from "vitest";
import { parseCliArgs } from "../src/args";

describe("parseCliArgs", () => {
  it("parses positional name", () => {
    const r = parseCliArgs(["my-app"]);
    expect(r.projectName).toBe("my-app");
  });

  it("parses --auth flag", () => {
    const r = parseCliArgs(["my-app", "--auth=local-json"]);
    expect(r.authMode).toBe("local-json");
    const r2 = parseCliArgs(["my-app", "--auth", "supabase"]);
    expect(r2.authMode).toBe("supabase");
  });

  it("rejects invalid --auth value", () => {
    expect(() => parseCliArgs(["m", "--auth=bogus"])).toThrow(/auth/);
  });

  it("supports --no-* booleans", () => {
    const r = parseCliArgs(["x", "--no-install", "--no-git", "--no-playwright", "--no-i18n"]);
    expect(r.runInstall).toBe(false);
    expect(r.runGitInit).toBe(false);
    expect(r.runPlaywrightInstall).toBe(false);
    expect(r.includeI18n).toBe(false);
  });

  it("defaults booleans to undefined when no flag", () => {
    const r = parseCliArgs(["x"]);
    expect(r.runInstall).toBeUndefined();
    expect(r.includeI18n).toBeUndefined();
  });

  it("recognises --help and --version", () => {
    expect(parseCliArgs(["--help"]).help).toBe(true);
    expect(parseCliArgs(["-h"]).help).toBe(true);
    expect(parseCliArgs(["--version"]).version).toBe(true);
    expect(parseCliArgs(["-v"]).version).toBe(true);
  });

  it("recognises --silent and --verbose", () => {
    expect(parseCliArgs(["x", "--silent"]).silent).toBe(true);
    expect(parseCliArgs(["x", "--verbose"]).verbose).toBe(true);
  });
});
