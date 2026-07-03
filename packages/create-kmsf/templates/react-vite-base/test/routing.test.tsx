import { describe, expect, it } from "vitest";
import { routeItems } from "../src/routes/route-items";

describe("routeItems", () => {
  it("defines home and settings routes", () => {
    expect(routeItems.map((item) => item.path)).toEqual(["/", "/settings"]);
  });
});
