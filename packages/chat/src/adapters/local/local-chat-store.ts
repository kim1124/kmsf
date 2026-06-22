import { createChatError, getErrorMessage } from "../../core/errors";
import type {
  ChatHistoryStore,
  ChatMessage,
  ChatModelSettings,
  ChatThread,
  StorageLike,
  StoreItemResult,
  StoreResult,
} from "../../core/types";

type LocalChatStoreOptions = {
  keyPrefix?: string;
  storage: StorageLike;
};

export function createLocalChatStore(options: LocalChatStoreOptions) {
  const prefix = options.keyPrefix ?? "kmsf.chat";
  const threadsKey = `${prefix}.threads`;
  const settingsKey = `${prefix}.settings`;

  const store = {
    deleteMessages(threadId: string) {
      options.storage.removeItem(`${prefix}.messages.${threadId}`);
    },
    deleteThread(threadId: string) {
      const threads = readList(options.storage, threadsKey, sortThreads).items.filter(
        (thread) => thread.id !== threadId,
      );
      options.storage.setItem(threadsKey, JSON.stringify(threads));
    },
    loadMessages(threadId: string): StoreResult<ChatMessage[]> {
      return readList(options.storage, `${prefix}.messages.${threadId}`, sortMessages);
    },
    loadSettings() {
      return readItem<ChatModelSettings>(options.storage, settingsKey);
    },
    loadThreads(): StoreResult<ChatThread[]> {
      return readList(options.storage, threadsKey, sortThreads);
    },
    saveMessages(threadId: string, messages: ChatMessage[]) {
      options.storage.setItem(`${prefix}.messages.${threadId}`, JSON.stringify(messages));
    },
    saveSettings(settings: ChatModelSettings) {
      options.storage.setItem(settingsKey, JSON.stringify(settings));
    },
    saveThreads(threads: ChatThread[]) {
      options.storage.setItem(threadsKey, JSON.stringify(threads));
    },
  } satisfies ChatHistoryStore;

  return store;
}

function readList<T>(storage: StorageLike, key: string, sort: (items: T[]) => T[]): StoreResult<T[]> {
  try {
    const raw = storage.getItem(key);
    return { items: raw ? sort(JSON.parse(raw) as T[]) : [] };
  } catch (error) {
    return {
      error: createChatError("local_storage_parse_error", getErrorMessage(error), error),
      items: [],
    };
  }
}

function readItem<T>(storage: StorageLike, key: string): StoreItemResult<T> {
  try {
    const raw = storage.getItem(key);
    return { item: raw ? (JSON.parse(raw) as T) : null };
  } catch (error) {
    return {
      error: createChatError("local_storage_parse_error", getErrorMessage(error), error),
      item: null,
    };
  }
}

function sortThreads(threads: ChatThread[]) {
  return [...threads].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
