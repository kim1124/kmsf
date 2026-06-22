export type ChatProvider = "ollama";
export type ChatStorageMode = "local" | "local-db" | "supabase";
export type ChatLocalDbType = "lowdb-json";
export type ChatRole = "system" | "user" | "assistant";
export type ChatMessageStatus = "pending" | "complete" | "error" | "aborted";
export type ModelDiscoveryStatus = "idle" | "loading" | "ready" | "error";
export type ChatThreadSource = "main" | "floating";

export interface ChatUserIdentity {
  id: string;
  email?: string;
  displayName?: string;
}

export interface ChatModelSettings {
  baseUrl: string;
  localDbEndpoint?: string;
  localDbPath?: string;
  localDbType?: ChatLocalDbType;
  manualModelEntryAllowed: boolean;
  manualModelName?: string;
  modelConnectedAt?: string;
  modelDiscoveryStatus: ModelDiscoveryStatus;
  provider: ChatProvider;
  selectedModel: string | null;
  storageMode: ChatStorageMode;
}

export interface ChatThread {
  createdAt: string;
  id: string;
  source?: ChatThreadSource;
  title: string;
  updatedAt: string;
}

export interface ChatMessage {
  content: string;
  createdAt: string;
  error?: string;
  id: string;
  role: ChatRole;
  status: ChatMessageStatus;
  thinking?: string;
  threadId: string;
  updatedAt: string;
}

export interface ChatState {
  activeThreadId: string | null;
  error: string | null;
  messagesByThread: Record<string, ChatMessage[]>;
  pendingAssistantMessageId: string | null;
  threads: ChatThread[];
}

export interface ChatSetupState {
  completed: boolean;
  settings: ChatModelSettings;
}

export interface ChatPackageError {
  code: string;
  message: string;
  cause?: unknown;
}

export interface StorageLike {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface StoreResult<T> {
  error?: ChatPackageError;
  items: T;
}

export interface StoreItemResult<T> {
  error?: ChatPackageError;
  item: T | null;
}

export interface ChatHistoryStore {
  deleteMessages(threadId: string): void | Promise<unknown>;
  deleteThread(threadId: string): void | Promise<unknown>;
  loadMessages(threadId: string): StoreResult<ChatMessage[]> | Promise<StoreResult<ChatMessage[]>>;
  loadSettings(): StoreItemResult<ChatModelSettings> | Promise<StoreItemResult<ChatModelSettings>>;
  loadThreads(): StoreResult<ChatThread[]> | Promise<StoreResult<ChatThread[]>>;
  saveMessages(threadId: string, messages: ChatMessage[]): void | Promise<unknown>;
  saveSettings(settings: ChatModelSettings): void | Promise<unknown>;
  saveThreads(threads: ChatThread[]): void | Promise<unknown>;
}
