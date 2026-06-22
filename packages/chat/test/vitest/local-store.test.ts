import { describe, expect, it } from "vitest";

import { createLocalChatStore } from "../../src/adapters/local/local-chat-store";
import { createLocalSetupStore } from "../../src/adapters/local/local-setup-store";
import { createDefaultChatSetup } from "../../src/core/setup-state";

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("local stores", () => {
  it("persists setup completion and settings", () => {
    const storage = new MemoryStorage();
    const store = createLocalSetupStore({ storage });
    const settings = { ...createDefaultChatSetup(), selectedModel: "llama3.2" };

    store.save({ completed: true, settings });

    expect(store.load()).toEqual({ completed: true, settings });
  });

  it("loads threads by updated time descending and messages by created time ascending", () => {
    const storage = new MemoryStorage();
    const store = createLocalChatStore({ storage });

    store.saveThreads([
      { createdAt: "2026-06-08T00:00:00.000Z", id: "old", title: "old", updatedAt: "2026-06-08T00:00:00.000Z" },
      { createdAt: "2026-06-08T00:01:00.000Z", id: "new", title: "new", updatedAt: "2026-06-08T00:01:00.000Z" },
    ]);
    store.saveMessages("new", [
      {
        content: "second",
        createdAt: "2026-06-08T00:02:00.000Z",
        id: "2",
        role: "assistant",
        status: "complete",
        threadId: "new",
        updatedAt: "2026-06-08T00:02:00.000Z",
      },
      {
        content: "first",
        createdAt: "2026-06-08T00:01:00.000Z",
        id: "1",
        role: "user",
        status: "complete",
        threadId: "new",
        updatedAt: "2026-06-08T00:01:00.000Z",
      },
    ]);

    expect(store.loadThreads().items.map((thread) => thread.id)).toEqual(["new", "old"]);
    expect(store.loadMessages("new").items.map((message) => message.id)).toEqual(["1", "2"]);
  });

  it("applies custom key prefix to threads and settings", () => {
    const storage = new MemoryStorage();
    const store = createLocalChatStore({ keyPrefix: "custom.chat", storage });

    store.saveThreads([]);
    store.saveSettings({ ...createDefaultChatSetup(), selectedModel: "model-a" });

    expect(storage.values.has("custom.chat.threads")).toBe(true);
    expect(storage.values.has("custom.chat.settings")).toBe(true);
    expect(storage.values.has("kmsf.chat.threads")).toBe(false);
    expect(storage.values.has("kmsf.chat.settings")).toBe(false);
  });

  it("deletes a thread and its messages from local persistence", () => {
    const storage = new MemoryStorage();
    const store = createLocalChatStore({ storage });

    store.saveThreads([
      { createdAt: "2026-06-08T00:00:00.000Z", id: "thread-1", title: "thread", updatedAt: "2026-06-08T00:00:00.000Z" },
    ]);
    store.saveMessages("thread-1", [
      {
        content: "message",
        createdAt: "2026-06-08T00:00:00.000Z",
        id: "message-1",
        role: "user",
        status: "complete",
        threadId: "thread-1",
        updatedAt: "2026-06-08T00:00:00.000Z",
      },
    ]);

    store.deleteThread("thread-1");
    store.deleteMessages("thread-1");

    expect(store.loadThreads().items).toEqual([]);
    expect(store.loadMessages("thread-1").items).toEqual([]);
    expect(storage.values.has("kmsf.chat.messages.thread-1")).toBe(false);
  });

  it("returns safe empty state for corrupt JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem("kmsf.chat.threads", "{broken");
    const store = createLocalChatStore({ storage });

    expect(store.loadThreads()).toMatchObject({
      error: { code: "local_storage_parse_error" },
      items: [],
    });
  });
});
