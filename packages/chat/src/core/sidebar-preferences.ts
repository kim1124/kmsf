import type { StorageLike } from "./types";

export const CHAT_SIDEBAR_WIDTH_KEY = "kmsf.chat.sidebar.width";
export const CHAT_SIDEBAR_DEFAULT_WIDTH = 300;
export const CHAT_SIDEBAR_MIN_WIDTH = 200;
export const CHAT_SIDEBAR_MAX_RATIO = 0.35;

type ClampSidebarWidthInput = {
  viewportWidth: number;
  width: number;
};

export function getSidebarWidthStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function clampSidebarWidth({ viewportWidth, width }: ClampSidebarWidthInput) {
  const maxWidth = Math.max(CHAT_SIDEBAR_MIN_WIDTH, Math.floor(viewportWidth * CHAT_SIDEBAR_MAX_RATIO));
  return Math.min(Math.max(Math.round(width), CHAT_SIDEBAR_MIN_WIDTH), maxWidth);
}

export function loadSidebarWidthPreference(
  storage: StorageLike | null = getSidebarWidthStorage(),
  viewportWidth = getViewportWidth(),
) {
  if (!storage) {
    return clampSidebarWidth({ viewportWidth, width: CHAT_SIDEBAR_DEFAULT_WIDTH });
  }

  const raw = storage.getItem(CHAT_SIDEBAR_WIDTH_KEY);
  if (!raw) {
    return clampSidebarWidth({ viewportWidth, width: CHAT_SIDEBAR_DEFAULT_WIDTH });
  }

  try {
    const parsed = JSON.parse(raw) as Partial<{ width: unknown }>;
    if (typeof parsed.width !== "number") {
      return clampSidebarWidth({ viewportWidth, width: CHAT_SIDEBAR_DEFAULT_WIDTH });
    }

    return clampSidebarWidth({ viewportWidth, width: parsed.width });
  } catch {
    return clampSidebarWidth({ viewportWidth, width: CHAT_SIDEBAR_DEFAULT_WIDTH });
  }
}

export function saveSidebarWidthPreference(
  storage: StorageLike | null,
  width: number,
  viewportWidth = getViewportWidth(),
) {
  if (!storage) {
    return;
  }

  storage.setItem(
    CHAT_SIDEBAR_WIDTH_KEY,
    JSON.stringify({ width: clampSidebarWidth({ viewportWidth, width }) }),
  );
}

function getViewportWidth() {
  if (typeof window === "undefined") {
    return 1200;
  }

  return window.innerWidth;
}
