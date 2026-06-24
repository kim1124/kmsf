import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  ChatSetupPage,
  ChatShell,
  createDefaultChatSetup,
  createLocalChatStore,
  createLocalSetupStore,
  createOllamaClient,
  formatConnectionTimestamp,
  markModelDiscoveryReady,
  type ChatHistoryStore,
  type ChatModelSettings,
  type ChatSetupState,
} from "../../src";
import "../../src/styles/index.scss";
import "./styles.css";

const storage = window.localStorage;
const setupStore = createLocalSetupStore({ storage });
const chatStore = createPlaygroundChatStore();

function readInitialSetup() {
  if (new URLSearchParams(window.location.search).has("reset")) {
    storage.clear();
    return { completed: false, settings: createDefaultChatSetup() };
  }
  return setupStore.tryLoad().item ?? { completed: false, settings: createDefaultChatSetup() };
}

function createPlaygroundChatStore(): ChatHistoryStore {
  const store = createLocalChatStore({ storage });
  const searchParams = new URLSearchParams(window.location.search);

  if (!searchParams.has("slowHistory")) {
    return store;
  }

  return {
    ...store,
    async loadMessages(threadId) {
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      return store.loadMessages(threadId);
    },
  };
}

function ExampleApp() {
  const [setup, setSetup] = useState<ChatSetupState>(() => readInitialSetup());
  const [models, setModels] = useState<string[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);
  const [setupToastMessage, setSetupToastMessage] = useState<string | null>(null);
  const client = useMemo(() => createOllamaClient({ baseUrl: setup.settings.baseUrl }), [setup.settings.baseUrl]);

  async function refreshModels() {
    const result = await client.listModels();
    if (result.ok) {
      setModels(result.models.map((model) => model.name));
      setModelError(null);
      setSetup((current) => ({
        ...current,
        settings: markModelDiscoveryReady(current.settings, formatConnectionTimestamp()),
      }));
      return;
    }

    setModels([]);
    setModelError(result.error.message);
    setSetup((current) => ({
      ...current,
      settings: {
        ...current.settings,
        manualModelEntryAllowed: true,
        modelConnectedAt: undefined,
        modelDiscoveryStatus: "error",
      },
    }));
  }

  useEffect(() => {
    void refreshModels();
  }, [client]);

  useEffect(() => {
    if (!setupToastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setSetupToastMessage(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [setupToastMessage]);

  function updateSettings(settings: ChatModelSettings) {
    const next = { ...setup, settings };
    setSetup(next);
    setupStore.save(next);
    chatStore.saveSettings(settings);
  }

  function completeSetup() {
    const next = { ...setup, completed: true };
    setSetup(next);
    setSetupToastMessage("로컬 LLM 설정이 완료되었습니다.");
    setupStore.save(next);
  }

  if (!setup.completed) {
    return (
      <div className="kmsf-chat-root">
        <ChatSetupPage
          modelError={modelError}
          models={models}
          settings={setup.settings}
          onRefreshModels={refreshModels}
          onSettingsChange={(settings) => setSetup({ ...setup, settings })}
          onSubmit={completeSetup}
        />
      </div>
    );
  }

  return (
    <div className="kmsf-chat-root kmsf-chat-app">
      {setupToastMessage ? (
        <div className="kmsf-chat-toast" role="status" aria-live="polite">
          {setupToastMessage}
        </div>
      ) : null}
      <header className="kmsf-chat-playground-topbar" aria-label="@kmsf/chat playground">
        <div>
          <p className="kmsf-chat-eyebrow">Package playground</p>
          <h1>@kmsf/chat</h1>
          <p>로컬 LLM 설정, 채팅 세션, 저장소 옵션을 검증합니다.</p>
        </div>
      </header>
      <ChatShell
        modelError={modelError}
        models={models}
        settings={setup.settings}
        store={chatStore}
        onRefreshModels={refreshModels}
        onSettingsChange={updateSettings}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExampleApp />
  </StrictMode>,
);
