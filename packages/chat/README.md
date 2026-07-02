# @kmsf/chat

`@kmsf/chat`은 local LLM workflow를 위한 standalone React chat package다. 초기 대상은 Ollama이며, host app이 storage와 설정 저장 방식을 주입할 수 있도록 package boundary를 유지한다.

## 구현된 기능

- ChatGPT-like chat shell
- Ollama model discovery: `GET /api/tags`
- Ollama streaming chat: `POST /api/chat`
- model selection이 끝나기 전 prompt submit 비활성화
- model discovery 실패 시 manual model-name fallback
- local browser storage adapter
- Supabase storage adapter
- host-injected `local-db` storage mode contract
- setup page, settings dialog, embeddable settings page
- floating chatbot entry point
- floating panel position persistence
- close-to-save one-time session
- resizable sidebar와 package-scoped width persistence
- `@kmsf/chat/styles.css` style entry
- Vitest logic tests와 Playwright browser tests

## 사용

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

`@kmsf/chat`은 기본 model을 hard-code하지 않는다. 사용자는 discovery된 model을 선택하거나 model 이름을 수동 입력해야 한다.

`ChatFloatingButton`은 `ChatShell`과 같은 setup/store contract를 사용한다. 닫힌 floating session은 `ChatHistoryStore`를 통해 저장된다.

## Storage

지원 storage boundary:

- `createLocalChatStore`
- `createSupabaseChatStore`
- host-provided `ChatHistoryStore`
- host-provided local DB API endpoint

Package는 Supabase service key나 host app env를 직접 읽지 않는다.

## Local Ollama

기본 Ollama base URL은 `http://localhost:11434`다.

기본 테스트는 Ollama를 mock한다. 실제 Ollama 검증은 host networking과 CORS 정책을 확인한 뒤 별도 수행한다.

## Playground

루트에서 실행:

```bash
npm --workspace=@kmsf/chat run dev
```

기본 포트는 `4014`다.

## 검증

```bash
npm --workspace=@kmsf/chat run lint
npm --workspace=@kmsf/chat run test:run
npm --workspace=@kmsf/chat run build
npm --workspace=@kmsf/chat run test:e2e
npm --workspace=@kmsf/chat run verify
npm --workspace=@kmsf/chat run verify:full
```
