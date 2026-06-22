import { describe, expect, it } from "vitest";

import { selectDiscoveredModel } from "../../src/core/settings-state";
import { createDefaultChatSetup } from "../../src/core/setup-state";

describe("settings state", () => {
  it("selects a discovered model and clears manual fallback input", () => {
    const settings = selectDiscoveredModel(
      {
        ...createDefaultChatSetup(),
        manualModelName: "manual-model",
      },
      "model-a",
    );

    expect(settings.selectedModel).toBe("model-a");
    expect(settings.manualModelName).toBe("");
  });

  it("clears the selected model when the model select is reset", () => {
    const settings = selectDiscoveredModel(
      {
        ...createDefaultChatSetup(),
        manualModelName: "manual-model",
        selectedModel: "model-a",
      },
      "",
    );

    expect(settings.selectedModel).toBeNull();
    expect(settings.manualModelName).toBe("");
  });
});
