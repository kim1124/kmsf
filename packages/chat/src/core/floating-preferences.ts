import type { StorageLike } from "./types";

export const FLOATING_CHAT_PREFERENCES_KEY = "kmsf.chat.floating.preferences";

export type FloatingChatPosition = {
  x: number;
  y: number;
};

export type FloatingChatPreferences = {
  position: FloatingChatPosition | null;
  visible: boolean;
};

type ClampInput = {
  buttonSize: number;
  margin: number;
  position: FloatingChatPosition;
  viewport: {
    height: number;
    width: number;
  };
};

export function createDefaultFloatingChatPreferences(): FloatingChatPreferences {
  return {
    position: null,
    visible: true,
  };
}

export function getFloatingChatStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadFloatingChatPreferences(storage: StorageLike | null = getFloatingChatStorage()) {
  if (!storage) {
    return createDefaultFloatingChatPreferences();
  }

  const raw = storage.getItem(FLOATING_CHAT_PREFERENCES_KEY);
  if (!raw) {
    return createDefaultFloatingChatPreferences();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FloatingChatPreferences>;

    return {
      position: isPosition(parsed.position) ? parsed.position : null,
      visible: parsed.visible ?? true,
    };
  } catch {
    return createDefaultFloatingChatPreferences();
  }
}

export function saveFloatingChatPreferences(
  storage: StorageLike | null,
  preferences: FloatingChatPreferences,
) {
  if (!storage) {
    return;
  }

  storage.setItem(FLOATING_CHAT_PREFERENCES_KEY, JSON.stringify(preferences));
}

export function updateFloatingChatPreferences(
  updates: Partial<FloatingChatPreferences>,
  storage: StorageLike | null = getFloatingChatStorage(),
) {
  const next = {
    ...loadFloatingChatPreferences(storage),
    ...updates,
  };

  saveFloatingChatPreferences(storage, next);
  return next;
}

export function clampFloatingPosition({ buttonSize, margin, position, viewport }: ClampInput): FloatingChatPosition {
  const maxX = Math.max(margin, viewport.width - buttonSize - margin);
  const maxY = Math.max(margin, viewport.height - buttonSize - margin);

  return {
    x: clamp(position.x, margin, maxX),
    y: clamp(position.y, margin, maxY),
  };
}

export function hasMovedPastDragThreshold(
  start: FloatingChatPosition,
  current: FloatingChatPosition,
  threshold = 6,
) {
  return Math.hypot(current.x - start.x, current.y - start.y) > threshold;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isPosition(value: unknown): value is FloatingChatPosition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const position = value as Partial<FloatingChatPosition>;
  return typeof position.x === "number" && typeof position.y === "number";
}
