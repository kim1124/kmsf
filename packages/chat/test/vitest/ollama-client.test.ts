import { describe, expect, it, vi } from "vitest";

import { createOllamaClient, parseOllamaStream } from "../../src/adapters/ollama/ollama-client";

function streamFromLines(lines: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const line of lines) {
        controller.enqueue(encoder.encode(`${line}\n`));
      }
      controller.close();
    },
  });
}

describe("ollama client", () => {
  it("lists models from the Ollama tags endpoint", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ models: [{ name: "llama3.2" }] })));
    const client = createOllamaClient({ baseUrl: "http://localhost:11434", fetch });

    await expect(client.listModels()).resolves.toEqual({
      models: [{ name: "llama3.2" }],
      ok: true,
    });
    expect(fetch).toHaveBeenCalledWith("http://localhost:11434/api/tags", { method: "GET" });
  });

  it("normalizes model discovery errors while allowing manual entry", async () => {
    const fetch = vi.fn(async () => new Response("offline", { status: 503 }));
    const client = createOllamaClient({ baseUrl: "http://localhost:11434", fetch });

    await expect(client.listModels()).resolves.toMatchObject({
      error: {
        code: "ollama_models_unavailable",
      },
      manualEntryAllowed: true,
      models: [],
      ok: false,
    });
  });

  it("parses content and thinking chunks from a streaming response", async () => {
    const stream = streamFromLines([
      JSON.stringify({ message: { content: "안", thinking: "계획" }, done: false }),
      JSON.stringify({ message: { content: "녕" }, done: false }),
      JSON.stringify({ done: true }),
    ]);

    await expect(parseOllamaStream(stream)).resolves.toEqual({
      content: "안녕",
      thinking: "계획",
    });
  });

  it("streams chat with the selected model", async () => {
    const fetch = vi.fn(async () => new Response(streamFromLines([JSON.stringify({ message: { content: "ok" } })])));
    const client = createOllamaClient({ baseUrl: "http://localhost:11434/", fetch });

    await expect(
      client.streamChat({
        messages: [{ content: "hello", role: "user" }],
        model: "manual-model",
      }),
    ).resolves.toEqual({ content: "ok", thinking: "" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/chat",
      expect.objectContaining({
        body: JSON.stringify({
          messages: [{ content: "hello", role: "user" }],
          model: "manual-model",
          stream: true,
        }),
        method: "POST",
      }),
    );
  });

  it("throws a normalized error when chat response fails", async () => {
    const fetch = vi.fn(async () => new Response("failed", { status: 500 }));
    const client = createOllamaClient({ baseUrl: "http://localhost:11434", fetch });

    await expect(
      client.streamChat({
        messages: [{ content: "hello", role: "user" }],
        model: "manual-model",
      }),
    ).rejects.toMatchObject({
      code: "ollama_chat_error",
      message: "Ollama chat failed with 500.",
    });
  });
});
