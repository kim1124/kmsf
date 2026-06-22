import type { ChatModelSettings, ChatSetupState, ChatStorageMode, ChatUserIdentity } from "./types";

export const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

type SetupOverrides = Partial<ChatModelSettings>;

type ValidationContext = {
  hasSupabaseStoreFactory?: boolean;
  userIdentity?: ChatUserIdentity | null;
};

type ValidationError = {
  field: "baseUrl" | "model" | "supabase";
  message: string;
};

export function createDefaultChatSetup(overrides: SetupOverrides = {}): ChatModelSettings {
  const modelDiscoveryStatus = overrides.modelDiscoveryStatus ?? "idle";
  return {
    baseUrl: overrides.baseUrl ?? DEFAULT_OLLAMA_BASE_URL,
    localDbEndpoint: overrides.localDbEndpoint,
    localDbPath: overrides.localDbPath,
    localDbType: overrides.localDbType ?? "lowdb-json",
    manualModelEntryAllowed: overrides.manualModelEntryAllowed ?? modelDiscoveryStatus === "error",
    manualModelName: overrides.manualModelName,
    modelConnectedAt: overrides.modelConnectedAt,
    modelDiscoveryStatus,
    provider: "ollama",
    selectedModel: overrides.selectedModel ?? null,
    storageMode: overrides.storageMode ?? "local",
  };
}

export function canSubmitPrompt(settings: ChatModelSettings) {
  return getEffectiveModel(settings) !== null;
}

export function canSubmitLocalLlmChat(settings: ChatModelSettings) {
  return settings.provider === "ollama" && settings.baseUrl.trim().length > 0 && canSubmitPrompt(settings);
}

export function getEffectiveModel(settings: ChatModelSettings) {
  return normalizeModelName(settings.selectedModel) ?? normalizeModelName(settings.manualModelName) ?? null;
}

export function markModelDiscoveryReady(settings: ChatModelSettings, connectedAt: string): ChatModelSettings {
  return {
    ...settings,
    manualModelEntryAllowed: true,
    modelConnectedAt: connectedAt,
    modelDiscoveryStatus: "ready",
  };
}

export function getLlmConnectionStatus(settings: ChatModelSettings) {
  const connected = settings.modelDiscoveryStatus === "ready" && Boolean(settings.modelConnectedAt);

  return {
    connected,
    connectedAt: connected ? settings.modelConnectedAt ?? null : null,
    label: connected ? "성공" : "실패",
  };
}

export function formatConnectionTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    " ",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}

export function validateChatSetup(settings: ChatModelSettings, context: ValidationContext = {}) {
  const errors: ValidationError[] = [];

  if (settings.baseUrl.trim().length === 0) {
    errors.push({ field: "baseUrl", message: "Ollama base URL is required." });
  }
  if (!canSubmitPrompt(settings)) {
    errors.push({ field: "model", message: "A model must be selected or entered." });
  }
  if (settings.storageMode === "supabase") {
    if (!context.userIdentity?.id) {
      errors.push({ field: "supabase", message: "Supabase mode requires a user identity." });
    }
    if (!context.hasSupabaseStoreFactory) {
      errors.push({ field: "supabase", message: "Supabase mode requires a store factory." });
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}

export function resolveInitialSetupState(input: { persisted?: ChatSetupState | null; storageMode?: ChatStorageMode }) {
  if (input.persisted?.completed) {
    return createDefaultChatSetup(input.persisted.settings);
  }
  return createDefaultChatSetup({ storageMode: input.storageMode });
}

function normalizeModelName(value: string | null | undefined) {
  const model = value?.trim();
  return model ? model : null;
}
