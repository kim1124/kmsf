import { describe, it, expect } from "vitest";
import { createLogger } from "../src/logger";

describe("createLogger", () => {
  it("info prints to provided sink", () => {
    const out: string[] = [];
    const log = createLogger({
      out: (s) => out.push(s),
      err: () => {},
      level: "info",
      color: false,
    });
    log.info("hello");
    expect(out.join("")).toContain("hello");
  });

  it("debug suppressed at info level", () => {
    const out: string[] = [];
    const log = createLogger({
      out: (s) => out.push(s),
      err: () => {},
      level: "info",
      color: false,
    });
    log.debug("noisy");
    expect(out.join("")).toBe("");
  });

  it("debug shown at debug level", () => {
    const out: string[] = [];
    const log = createLogger({
      out: (s) => out.push(s),
      err: () => {},
      level: "debug",
      color: false,
    });
    log.debug("noisy");
    expect(out.join("")).toContain("noisy");
  });

  it("warn / error route to err sink", () => {
    const err: string[] = [];
    const log = createLogger({
      out: () => {},
      err: (s) => err.push(s),
      level: "info",
      color: false,
    });
    log.warn("careful");
    log.error("bad");
    expect(err.join("")).toContain("careful");
    expect(err.join("")).toContain("bad");
  });

  it("step + stepDone produce single-line update with duration", () => {
    const out: string[] = [];
    const log = createLogger({
      out: (s) => out.push(s),
      err: () => {},
      level: "info",
      color: false,
    });
    log.step("Doing X");
    log.stepDone(123);
    const joined = out.join("");
    expect(joined).toContain("Doing X");
    expect(joined).toContain("123");
  });
});
