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
    manualModelEntryAllowed: overrides.manualModelEntryAllowed ?? modelDiscoveryStatus === "error",
    manualModelName: overrides.manualModelName,
    modelDiscoveryStatus,
    provider: "ollama",
    selectedModel: overrides.selectedModel ?? null,
    storageMode: overrides.storageMode ?? "local",
  };
}

export function canSubmitPrompt(settings: ChatModelSettings) {
  return getEffectiveModel(settings) !== null;
}

export function getEffectiveModel(settings: ChatModelSettings) {
  return normalizeModelName(settings.selectedModel) ?? normalizeModelName(settings.manualModelName) ?? null;
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
