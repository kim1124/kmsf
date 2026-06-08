import { describe, expect, test } from "vitest";

import { createDashboardDraft, dashboardEditorTypes, validateDashboardDraft } from "../../example/src/data/dashboard-widget-editor";

describe("dashboard widget editor fixtures", () => {
  test("generates complete random drafts for implemented chart types only", () => {
    expect(dashboardEditorTypes).not.toContain("map");
    expect(dashboardEditorTypes).not.toContain("custom");

    const first = createDashboardDraft({ seed: 1, type: "line" });
    const second = createDashboardDraft({ seed: 2, type: "line" });

    expect(first.type).toBe("line");
    expect(first.dataJson).not.toBe("[]");
    expect(first.dataJson).not.toBe(second.dataJson);
    expect(first.optionsJson).toMatch(/^\{/);
    expect(first.seriesJson).toMatch(/^\[/);
  });

  test("blocks unsupported option keys before widget creation", () => {
    const draft = createDashboardDraft({ seed: 3, type: "bar" });

    expect(validateDashboardDraft({ ...draft, optionsJson: "{\"notSupported\":true}" })).toMatchObject({
      error: "허용되지 않는 옵션입니다.",
      ok: false,
    });
  });
});
