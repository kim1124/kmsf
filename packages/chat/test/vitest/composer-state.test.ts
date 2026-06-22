import { describe, expect, it } from "vitest";

import { getComposerKeyAction } from "../../src/core/composer-state";

describe("composer state", () => {
  it("submits on Enter, keeps Shift+Enter as newline, and ignores composing Enter", () => {
    expect(getComposerKeyAction({ isComposing: false, key: "Enter", shiftKey: false })).toBe("submit");
    expect(getComposerKeyAction({ isComposing: false, key: "Enter", shiftKey: true })).toBe("newline");
    expect(getComposerKeyAction({ isComposing: true, key: "Enter", shiftKey: false })).toBe("ignore");
    expect(getComposerKeyAction({ isComposing: false, key: "a", shiftKey: false })).toBe("ignore");
  });
});
