import { describe, expect, it } from "vitest";

import {
  CHAT_SIDEBAR_DEFAULT_WIDTH,
  CHAT_SIDEBAR_MIN_WIDTH,
  clampSidebarWidth,
  loadSidebarWidthPreference,
  saveSidebarWidthPreference,
} from "../../src/core/sidebar-preferences";
import type { StorageLike } from "../../src/core/types";

describe("sidebar width preferences", () => {
  it("defaults to 300px", () => {
    expect(CHAT_SIDEBAR_DEFAULT_WIDTH).toBe(300);
    expect(CHAT_SIDEBAR_MIN_WIDTH).toBe(200);
  });

  it("clamps sidebar width between 200px and 35 percent of the viewport", () => {
    expect(clampSidebarWidth({ viewportWidth: 1200, width: 100 })).toBe(200);
    expect(clampSidebarWidth({ viewportWidth: 1200, width: 360 })).toBe(360);
    expect(clampSidebarWidth({ viewportWidth: 1200, width: 600 })).toBe(420);
  });

  it("persists a clamped sidebar width in package-scoped localStorage", () => {
    const storage = createMemoryStorage();

    saveSidebarWidthPreference(storage, 800, 1000);

    expect(loadSidebarWidthPreference(storage, 1000)).toBe(350);
  });

  it("falls back safely when stored width is invalid", () => {
    const storage = createMemoryStorage();

    storage.setItem("kmsf.chat.sidebar.width", JSON.stringify({ width: "wide" }));

    expect(loadSidebarWidthPreference(storage, 1200)).toBe(CHAT_SIDEBAR_DEFAULT_WIDTH);
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
