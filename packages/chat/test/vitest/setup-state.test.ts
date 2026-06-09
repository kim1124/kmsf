import { describe, expect, it } from "vitest";

import {
  canSubmitPrompt,
  createDefaultChatSetup,
  resolveInitialSetupState,
  validateChatSetup,
} from "../../src/core/setup-state";

describe("setup state", () => {
  it("uses Ollama and local storage by default without selecting a model", () => {
    const setup = createDefaultChatSetup();

    expect(setup).toMatchObject({
      baseUrl: "http://localhost:11434",
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
  });
});
