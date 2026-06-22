import { describe, expect, it } from "vitest";

import {
  clampFloatingPosition,
  createDefaultFloatingChatPreferences,
  hasMovedPastDragThreshold,
  loadFloatingChatPreferences,
  saveFloatingChatPreferences,
} from "../../src/core/floating-preferences";
import type { StorageLike } from "../../src/core/types";

describe("floating chat preferences", () => {
  it("defaults to visible with no saved position", () => {
    const storage = createMemoryStorage();

    expect(loadFloatingChatPreferences(storage)).toEqual(createDefaultFloatingChatPreferences());
  });

  it("persists visibility and button coordinates in package-scoped storage", () => {
    const storage = createMemoryStorage();

    saveFloatingChatPreferences(storage, {
      position: { x: 320, y: 240 },
      visible: false,
    });

    expect(loadFloatingChatPreferences(storage)).toEqual({
      position: { x: 320, y: 240 },
      visible: false,
    });
  });

  it("clamps restored button coordinates inside the viewport", () => {
    expect(
      clampFloatingPosition({
        buttonSize: 48,
        margin: 16,
        position: { x: 900, y: -20 },
        viewport: { height: 600, width: 800 },
      }),
    ).toEqual({ x: 736, y: 16 });
  });

  it("separates click from drag by movement threshold", () => {
    expect(hasMovedPastDragThreshold({ x: 10, y: 10 }, { x: 13, y: 14 })).toBe(false);
    expect(hasMovedPastDragThreshold({ x: 10, y: 10 }, { x: 20, y: 10 })).toBe(true);
  });
});

function createMemoryStorage(): StorageLike {
  const items = new Map<string, string>();

  return {
    getItem(key: string) {
      return items.get(key) ?? null;
    },
    removeItem(key: string) {
      items.delete(key);
    },
    setItem(key: string, value: string) {
      items.set(key, value);
    },
  };
}
