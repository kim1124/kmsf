import { describe, expect, it, vi } from "vitest";

import { createSupabaseChatStore } from "../../src/adapters/supabase/supabase-chat-store";
import { createDefaultChatSetup } from "../../src/core/setup-state";

function createTableMock(result: unknown = { data: [], error: null }) {
  const query = {
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    insert: vi.fn(() => query),
    order: vi.fn(() => Promise.resolve(result)),
    select: vi.fn(() => query),
    upsert: vi.fn(() => Promise.resolve(result)),
  };
  return query;
}

describe("supabase chat store", () => {
  it("filters thread reads by user id", async () => {
    const query = createTableMock({ data: [], error: null });
    const client = { from: vi.fn(() => query) };
    const store = createSupabaseChatStore({ client, user: { id: "user-1" } });

    await store.loadThreads();

    expect(client.from).toHaveBeenCalledWith("kmsf_chat_threads");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("filters message reads by thread id and user id", async () => {
    const query = createTableMock({ data: [], error: null });
    const store = createSupabaseChatStore({ client: { from: vi.fn(() => query) }, user: { id: "user-1" } });

    await store.loadMessages("thread-1");

    expect(query.eq).toHaveBeenCalledWith("thread_id", "thread-1");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("upserts settings with user id", async () => {
    const query = createTableMock({ data: null, error: null });
    const store = createSupabaseChatStore({ client: { from: vi.fn(() => query) }, user: { id: "user-1" } });

    await store.saveSettings({ ...createDefaultChatSetup(), selectedModel: "m", storageMode: "supabase" });

    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({ selectedModel: "m" }),
        user_id: "user-1",
      }),
      { onConflict: "user_id" },
    );
  });

  it("converts Supabase errors into normalized storage errors", async () => {
    const query = createTableMock({ data: null, error: { message: "denied" } });
    const store = createSupabaseChatStore({ client: { from: vi.fn(() => query) }, user: { id: "user-1" } });

    await expect(store.loadThreads()).resolves.toMatchObject({
      error: {
        code: "supabase_storage_error",
        message: "denied",
      },
      items: [],
    });
  });

  it("deletes threads and messages with user ownership filters", async () => {
    const query = createTableMock({ data: null, error: null });
    const client = { from: vi.fn(() => query) };
    const store = createSupabaseChatStore({ client, user: { id: "user-1" } });

    await store.deleteMessages("thread-1");
    await store.deleteThread("thread-1");

    expect(client.from).toHaveBeenCalledWith("kmsf_chat_messages");
    expect(client.from).toHaveBeenCalledWith("kmsf_chat_threads");
    expect(query.delete).toHaveBeenCalledTimes(2);
    expect(query.eq).toHaveBeenCalledWith("thread_id", "thread-1");
    expect(query.eq).toHaveBeenCalledWith("id", "thread-1");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
  });
});
