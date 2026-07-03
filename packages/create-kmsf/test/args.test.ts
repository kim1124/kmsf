import { describe, it, expect } from "vitest";
import { parseCliArgs } from "../src/args.js";

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
    const r3 = parseCliArgs(["my-app", "--auth=later"]);
    expect(r3.authMode).toBe("later");
  });

  it("parses --template flag", () => {
    const r = parseCliArgs(["my-app", "--template=react-vite-base"]);

    expect(r.templateId).toBe("react-vite-base");
  });

  it("rejects invalid --template value", () => {
    expect(() => parseCliArgs(["my-app", "--template=bogus"])).toThrow(/template/);
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

  it("parses selected KMSF packages", () => {
    const r = parseCliArgs(["x", "--packages=gridstack,data-table,charts,chat"]);

    expect(r.selectedPackages).toEqual(["gridstack", "data-table", "charts", "chat"]);
  });

  it("supports explicit empty package selection", () => {
    const r = parseCliArgs(["x", "--no-packages"]);

    expect(r.selectedPackages).toEqual([]);
  });

  it("rejects invalid package values", () => {
    expect(() => parseCliArgs(["x", "--packages=charts,bogus"])).toThrow(/packages/);
  });

  it("parses selected GNB layout regions", () => {
    const r = parseCliArgs(["x", "--layout=top,left,footer"]);

    expect(r.gnbRegions).toEqual(["top", "left", "footer"]);
  });

  it("rejects invalid GNB layout regions", () => {
    expect(() => parseCliArgs(["x", "--layout=top,bogus"])).toThrow(/layout/);
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
