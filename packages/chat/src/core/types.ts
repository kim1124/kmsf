export type ChatProvider = "ollama";
export type ChatStorageMode = "local" | "supabase";
export type ChatRole = "system" | "user" | "assistant";
export type ChatMessageStatus = "pending" | "complete" | "error" | "aborted";
export type ModelDiscoveryStatus = "idle" | "loading" | "ready" | "error";

export interface ChatUserIdentity {
  id: string;
  email?: string;
  displayName?: string;
}

export interface ChatModelSettings {
  baseUrl: string;
  manualModelEntryAllowed: boolean;
  manualModelName?: string;
  modelDiscoveryStatus: ModelDiscoveryStatus;
  provider: ChatProvider;
  selectedModel: string | null;
  storageMode: ChatStorageMode;
}

export interface ChatThread {
  createdAt: string;
  id: string;
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
