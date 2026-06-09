import { createChatError, getErrorMessage } from "../../core/errors";
import type { ChatMessage, ChatModelSettings, ChatThread, StorageLike, StoreResult } from "../../core/types";

const THREADS_KEY = "kmsf.chat.threads";
const SETTINGS_KEY = "kmsf.chat.settings";

type LocalChatStoreOptions = {
  keyPrefix?: string;
  storage: StorageLike;
};

export function createLocalChatStore(options: LocalChatStoreOptions) {
  const prefix = options.keyPrefix ?? "kmsf.chat";

  return {
    loadMessages(threadId: string): StoreResult<ChatMessage[]> {
      return readList(options.storage, `${prefix}.messages.${threadId}`, sortMessages);
    },
    loadSettings() {
      return readItem<ChatModelSettings>(options.storage, SETTINGS_KEY);
    },
    loadThreads(): StoreResult<ChatThread[]> {
      return readList(options.storage, THREADS_KEY, sortThreads);
    },
    saveMessages(threadId: string, messages: ChatMessage[]) {
      options.storage.setItem(`${prefix}.messages.${threadId}`, JSON.stringify(messages));
    },
    saveSettings(settings: ChatModelSettings) {
      options.storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    },
    saveThreads(threads: ChatThread[]) {
      options.storage.setItem(THREADS_KEY, JSON.stringify(threads));
    },
  };
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

function readItem<T>(storage: StorageLike, key: string) {
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
