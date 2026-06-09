import { createChatError, getErrorMessage } from "../../core/errors";
import type { ChatPackageError, ChatRole } from "../../core/types";

export type OllamaModel = {
  name: string;
};

export type OllamaMessage = {
  content: string;
  role: ChatRole;
};

type OllamaClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
};

type ListModelsResult =
  | { models: OllamaModel[]; ok: true }
  | { error: ChatPackageError; manualEntryAllowed: true; models: []; ok: false };

type StreamChatInput = {
  messages: OllamaMessage[];
  model: string;
  signal?: AbortSignal;
};

export function createOllamaClient(options: OllamaClientOptions) {
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  return {
    async listModels(): Promise<ListModelsResult> {
      try {
        const response = await fetchImpl(`${baseUrl}/api/tags`, { method: "GET" });
        if (!response.ok) {
          return modelDiscoveryError(`Ollama model discovery failed with ${response.status}.`);
        }
        const body = (await response.json()) as { models?: Array<{ name?: string }> };
        return {
          models: (body.models ?? [])
            .map((model) => ({ name: String(model.name ?? "").trim() }))
            .filter((model) => model.name.length > 0),
          ok: true,
        };
      } catch (error) {
        return modelDiscoveryError(getErrorMessage(error), error);
      }
    },

    async streamChat(input: StreamChatInput) {
      const response = await fetchImpl(`${baseUrl}/api/chat`, {
        body: JSON.stringify({
          messages: input.messages,
          model: input.model,
          stream: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: input.signal,
      });

      if (!response.ok) {
        throw createChatError("ollama_chat_error", `Ollama chat failed with ${response.status}.`);
      }
      if (!response.body) {
        return { content: "", thinking: "" };
      }
      return parseOllamaStream(response.body);
    },
  };
}

export async function parseOllamaStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let content = "";
  let thinking = "";
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      const chunk = JSON.parse(trimmed) as { message?: { content?: string; thinking?: string } };
      content += chunk.message?.content ?? "";
      thinking += chunk.message?.thinking ?? "";
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    const chunk = JSON.parse(trailing) as { message?: { content?: string; thinking?: string } };
    content += chunk.message?.content ?? "";
    thinking += chunk.message?.thinking ?? "";
  }

  return { content, thinking };
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function modelDiscoveryError(message: string, cause?: unknown): ListModelsResult {
  return {
    error: createChatError("ollama_models_unavailable", message, cause),
    manualEntryAllowed: true,
    models: [],
    ok: false,
  };
}
