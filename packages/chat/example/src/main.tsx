import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  ChatSettingsPage,
  ChatSetupPage,
  ChatShell,
  createDefaultChatSetup,
  createLocalSetupStore,
  createOllamaClient,
  type ChatModelSettings,
  type ChatSetupState,
} from "../../src";
import "../../src/styles.css";
import "./styles.css";

const storage = window.localStorage;
const setupStore = createLocalSetupStore({ storage });

function readInitialSetup() {
  if (new URLSearchParams(window.location.search).has("reset")) {
    storage.clear();
    return { completed: false, settings: createDefaultChatSetup() };
  }
  return setupStore.tryLoad().item ?? { completed: false, settings: createDefaultChatSetup() };
}

function ExampleApp() {
  const [setup, setSetup] = useState<ChatSetupState>(() => readInitialSetup());
  const [models, setModels] = useState<string[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("chat");
  const client = useMemo(() => createOllamaClient({ baseUrl: setup.settings.baseUrl }), [setup.settings.baseUrl]);

  async function refreshModels() {
    const result = await client.listModels();
    if (result.ok) {
      setModels(result.models.map((model) => model.name));
      setModelError(null);
      setSetup((current) => ({
        ...current,
        settings: {
          ...current.settings,
          manualModelEntryAllowed: true,
          modelDiscoveryStatus: "ready",
        },
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
        modelDiscoveryStatus: "error",
      },
    }));
  }

  useEffect(() => {
    void refreshModels();
  }, [client]);

  function updateSettings(settings: ChatModelSettings) {
    const next = { ...setup, settings };
    setSetup(next);
    setupStore.save(next);
  }

  function completeSetup() {
    const next = { ...setup, completed: true };
    setSetup(next);
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
      <div className="kmsf-chat-tabs" role="tablist" aria-label="예제 보기">
        <button
          aria-selected={activeTab === "chat"}
          role="tab"
          type="button"
          onClick={() => setActiveTab("chat")}
        >
          채팅
        </button>
        <button
          aria-selected={activeTab === "settings"}
          role="tab"
          type="button"
          onClick={() => setActiveTab("settings")}
        >
          설정 페이지
        </button>
      </div>
      {activeTab === "chat" ? (
        <ChatShell settings={setup.settings} onSettingsChange={updateSettings} />
      ) : (
        <ChatSettingsPage settings={setup.settings} />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExampleApp />
  </StrictMode>,
);
