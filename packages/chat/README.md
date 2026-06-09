# @kmsf/chat

Standalone React chat package for local LLM workflows.

## Features

- ChatGPT-like chat shell.
- Local Ollama model discovery and streaming chat.
- Initial setup page with required model selection.
- Manual model-name fallback when Ollama model discovery fails.
- Local browser storage adapter.
- Supabase storage adapter with consumer-provided client and user identity.
- Settings dialog and embeddable settings page.
- Tailwind CSS v4-ready example styling pipeline.
- Vitest logic tests and Playwright browser tests.

## Usage

```tsx
import {
  ChatSetupPage,
  ChatShell,
  createDefaultChatSetup,
} from "@kmsf/chat";
import "@kmsf/chat/styles.css";
```

The package does not hard-code a model default.
The first prompt is disabled until the user selects a discovered model or enters a model name manually.

## Local Ollama

Default Ollama base URL is `http://localhost:11434`.
The package calls:

- `GET /api/tags` for model discovery.
- `POST /api/chat` for streaming chat.

Default tests mock Ollama. Live Ollama verification should be run separately when host networking and CORS policy are known.

## Verification

```bash
npm --workspace=@kmsf/chat run test:run
npm --workspace=@kmsf/chat run test:e2e
npm --workspace=@kmsf/chat run verify
npm --workspace=@kmsf/chat run verify:full
```
