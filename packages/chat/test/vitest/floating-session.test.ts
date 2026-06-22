import { describe, expect, it } from "vitest";

import { createFloatingThread, mergeClosedFloatingThread } from "../../src/core/chat-state";
import type { ChatMessage, ChatThread } from "../../src/core/types";

describe("floating session persistence", () => {
  it("creates floating thread metadata", () => {
    const thread = createFloatingThread("Floating question", "2026-06-18T01:00:00.000Z");

    expect(thread.source).toBe("floating");
    expect(thread.title).toBe("Floating question");
  });

  it("saves closed floating thread as most recent when it has messages", () => {
    const oldThread: ChatThread = {
      createdAt: "2026-06-18T00:00:00.000Z",
      id: "old",
      title: "Old",
      updatedAt: "2026-06-18T00:00:00.000Z",
    };
    const floating = createFloatingThread("Question", "2026-06-18T01:00:00.000Z");
    const messages: ChatMessage[] = [
      {
        content: "Question",
        createdAt: "2026-06-18T01:00:00.000Z",
        id: "m1",
        role: "user",
        status: "complete",
        threadId: floating.id,
        updatedAt: "2026-06-18T01:00:00.000Z",
      },
    ];

    const next = mergeClosedFloatingThread([oldThread], floating, messages, "2026-06-18T01:10:00.000Z");

    expect(next.map((thread) => thread.id)).toEqual([floating.id, "old"]);
    expect(next[0]?.updatedAt).toBe("2026-06-18T01:10:00.000Z");
  });

  it("does not save an empty closed floating thread", () => {
    const thread = createFloatingThread("Empty", "2026-06-18T01:00:00.000Z");

    expect(mergeClosedFloatingThread([], thread, [], "2026-06-18T01:10:00.000Z")).toEqual([]);
  });
});
