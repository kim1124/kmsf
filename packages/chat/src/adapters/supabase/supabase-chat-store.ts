import { createChatError, getErrorMessage } from "../../core/errors";
import type { ChatMessage, ChatModelSettings, ChatThread, ChatUserIdentity } from "../../core/types";

type SupabaseQuery = {
  delete?: () => SupabaseQuery;
  eq: (column: string, value: unknown) => SupabaseQuery;
  insert?: (values: unknown) => Promise<SupabaseResponse<unknown>> | SupabaseQuery;
  order: (column: string, options?: { ascending?: boolean }) => Promise<SupabaseResponse<unknown>>;
  select: (columns?: string) => SupabaseQuery;
  upsert?: (values: unknown, options?: { onConflict?: string }) => Promise<SupabaseResponse<unknown>> | SupabaseQuery;
};

type SupabaseClientLike = {
  from: (table: string) => SupabaseQuery;
};

type SupabaseResponse<T> = {
  data: T;
  error: null | { message?: string };
};

type SupabaseChatStoreOptions = {
  client: SupabaseClientLike;
  user: ChatUserIdentity;
};

export function createSupabaseChatStore(options: SupabaseChatStoreOptions) {
  return {
    async loadMessages(threadId: string) {
      const response = await options.client
        .from("kmsf_chat_messages")
        .select("*")
        .eq("thread_id", threadId)
        .eq("user_id", options.user.id)
        .order("created_at", { ascending: true });
      return toItemsResult<ChatMessage>(response);
    },
    async loadThreads() {
      const response = await options.client
        .from("kmsf_chat_threads")
        .select("*")
        .eq("user_id", options.user.id)
        .order("updated_at", { ascending: false });
      return toItemsResult<ChatThread>(response);
    },
    async saveMessages(threadId: string, messages: ChatMessage[]) {
      const values = messages.map((message) => ({
        content: message.content,
        created_at: message.createdAt,
        error: message.error ?? null,
        id: message.id,
        role: message.role,
        status: message.status,
        thinking: message.thinking ?? null,
        thread_id: threadId,
        updated_at: message.updatedAt,
        user_id: options.user.id,
      }));
      const response = await options.client.from("kmsf_chat_messages").insert?.(values);
      return toWriteResult(response);
    },
    async saveSettings(settings: ChatModelSettings) {
      const response = await options.client.from("kmsf_chat_settings").upsert?.(
        {
          settings,
          updated_at: new Date().toISOString(),
          user_id: options.user.id,
        },
        { onConflict: "user_id" },
      );
      return toWriteResult(response);
    },
    async saveThreads(threads: ChatThread[]) {
      const values = threads.map((thread) => ({
        created_at: thread.createdAt,
        id: thread.id,
        title: thread.title,
        updated_at: thread.updatedAt,
        user_id: options.user.id,
      }));
      const response = await options.client.from("kmsf_chat_threads").upsert?.(values);
      return toWriteResult(response);
    },
  };
}

function toItemsResult<T>(response: SupabaseResponse<unknown>) {
  if (response.error) {
    return {
      error: createChatError("supabase_storage_error", getErrorMessage(response.error), response.error),
      items: [],
    };
  }
  return { items: Array.isArray(response.data) ? (response.data as T[]) : [] };
}

function toWriteResult(response: SupabaseResponse<unknown> | SupabaseQuery | undefined) {
  if (!response || !("error" in response)) {
    return { ok: true };
  }
  if (response.error) {
    return {
      error: createChatError("supabase_storage_error", getErrorMessage(response.error), response.error),
      ok: false,
    };
  }
  return { ok: true };
}
