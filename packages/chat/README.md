# @kmsf/chat

Standalone React chat package for local LLM workflows.

## Features

- ChatGPT-like chat shell.
- Local Ollama model discovery and streaming chat.
- Initial setup page with required model selection.
- Manual model-name fallback when Ollama model discovery fails.
- Local browser storage adapter.
- Supabase storage adapter with consumer-provided client and user identity.
- Host-injected `local-db` storage mode for KMSF local DB integration.
- Settings dialog and embeddable settings page.
- Floating chatbot entry point with close-to-save one-time sessions, visibility persistence, and draggable position persistence.
- Sass source styles compiled to the exported `@kmsf/chat/styles.css` entry.
- Vitest logic tests and Playwright browser tests.

## Usage

```tsx
import {
  ChatFloatingButton,
  ChatSetupPage,
  ChatShell,
  createDefaultChatSetup,
  createLocalChatStore,
} from "@kmsf/chat";
import "@kmsf/chat/styles.css";
```

The package does not hard-code a model default.
The first prompt is disabled until the user selects a discovered model or enters a model name manually.
`ChatFloatingButton` uses the same setup and store contract as `ChatShell`; closed floating sessions are saved through `ChatHistoryStore`.
`ChatHistoryStore` includes explicit deletion methods so hosts can permanently remove a thread and its messages through the same boundary.
The `local-db` storage mode is a package contract value with host API endpoint and server DB path settings; host apps provide the actual `ChatHistoryStore` implementation.

## Local Ollama

Default Ollama base URL is `http://localhost:11434`.
The package calls:

- `GET /api/tags` for model discovery.
- `POST /api/chat` for streaming chat.

The package does not read Ollama Desktop private history endpoints. Conversation history is stored through `createLocalChatStore`, `createSupabaseChatStore`, or a host-provided `ChatHistoryStore`.
Chat response failures are persisted as assistant messages with `status: "error"` and normalized error text so reload keeps the failed turn context.

Default tests mock Ollama. Live Ollama verification should be run separately when host networking and CORS policy are known.

## Verification

```bash
npm --workspace=@kmsf/chat run test:run
npm --workspace=@kmsf/chat run test:e2e
npm --workspace=@kmsf/chat run verify
npm --workspace=@kmsf/chat run verify:full
```
