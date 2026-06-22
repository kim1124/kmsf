import { describe, expect, it } from "vitest";

import {
  canSubmitLocalLlmChat,
  canSubmitPrompt,
  createDefaultChatSetup,
  getLlmConnectionStatus,
  markModelDiscoveryReady,
  resolveInitialSetupState,
  validateChatSetup,
} from "../../src/core/setup-state";

describe("setup state", () => {
  it("uses Ollama and local storage by default without selecting a model", () => {
    const setup = createDefaultChatSetup();

    expect(setup).toMatchObject({
      baseUrl: "http://localhost:11434",
      localDbType: "lowdb-json",
      provider: "ollama",
      selectedModel: null,
      storageMode: "local",
    });
  });

  it("blocks prompt submission until a model is selected or manually entered", () => {
    expect(canSubmitPrompt(createDefaultChatSetup())).toBe(false);
    expect(canSubmitPrompt({ ...createDefaultChatSetup(), manualModelName: "llama3.2" })).toBe(true);
    expect(canSubmitPrompt({ ...createDefaultChatSetup(), selectedModel: "qwen2.5" })).toBe(true);
  });

  it("requires Ollama base URL and effective model before local LLM chat can run", () => {
    expect(canSubmitLocalLlmChat(createDefaultChatSetup())).toBe(false);
    expect(canSubmitLocalLlmChat({ ...createDefaultChatSetup(), baseUrl: "", selectedModel: "model-a" })).toBe(false);
    expect(canSubmitLocalLlmChat({ ...createDefaultChatSetup(), selectedModel: "model-a" })).toBe(true);
  });

  it("restores a persisted user-selected model without treating it as a default", () => {
    const setup = resolveInitialSetupState({
      persisted: {
        completed: true,
        settings: {
          ...createDefaultChatSetup(),
          selectedModel: "user-choice",
        },
      },
    });

    expect(setup.selectedModel).toBe("user-choice");
    expect(createDefaultChatSetup().selectedModel).toBeNull();
  });

  it("allows manual model entry when discovery fails", () => {
    const setup = createDefaultChatSetup({ modelDiscoveryStatus: "error" });

    expect(setup.modelDiscoveryStatus).toBe("error");
    expect(setup.manualModelEntryAllowed).toBe(true);
  });

  it("records model discovery connection time for sidebar status", () => {
    const setup = markModelDiscoveryReady(createDefaultChatSetup(), "2026-06-19 16:30:45");

    expect(setup).toMatchObject({
      manualModelEntryAllowed: true,
      modelConnectedAt: "2026-06-19 16:30:45",
      modelDiscoveryStatus: "ready",
    });
    expect(getLlmConnectionStatus(setup)).toEqual({
      connected: true,
      connectedAt: "2026-06-19 16:30:45",
      label: "성공",
    });
    expect(getLlmConnectionStatus(createDefaultChatSetup({ modelDiscoveryStatus: "error" }))).toEqual({
      connected: false,
      connectedAt: null,
      label: "실패",
    });
  });

  it("validates base URL and Supabase requirements", () => {
    expect(validateChatSetup({ ...createDefaultChatSetup(), baseUrl: "" }).errors).toContainEqual({
      field: "baseUrl",
      message: "Ollama base URL is required.",
    });
    expect(validateChatSetup({ ...createDefaultChatSetup(), selectedModel: "m" }).valid).toBe(true);
    expect(validateChatSetup({ ...createDefaultChatSetup(), selectedModel: "m", storageMode: "supabase" }).errors)
      .toEqual([
        { field: "supabase", message: "Supabase mode requires a user identity." },
        { field: "supabase", message: "Supabase mode requires a store factory." },
      ]);
    expect(
      validateChatSetup(
        { ...createDefaultChatSetup(), selectedModel: "m", storageMode: "supabase" },
        {
          hasSupabaseStoreFactory: true,
          userIdentity: { id: "00000000-0000-0000-0000-000000000001" },
        },
      ).valid,
    ).toBe(true);
    expect(validateChatSetup({ ...createDefaultChatSetup(), selectedModel: "m", storageMode: "local-db" }).valid)
      .toBe(true);
  });

  it("preserves host-injected local DB endpoint and path settings", () => {
    const setup = createDefaultChatSetup({
      localDbEndpoint: "/api/kmsf/chat-history",
      localDbPath: "apps/kmsf/.local/chat.db.json",
      storageMode: "local-db",
    });

    expect(setup).toMatchObject({
      localDbEndpoint: "/api/kmsf/chat-history",
      localDbPath: "apps/kmsf/.local/chat.db.json",
      localDbType: "lowdb-json",
      storageMode: "local-db",
    });
    expect(validateChatSetup({ ...setup, selectedModel: "model-a" }).valid).toBe(true);
  });
});
