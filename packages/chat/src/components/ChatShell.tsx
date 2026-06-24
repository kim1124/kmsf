import type { CSSProperties, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Eye, EyeOff } from "lucide-react";

import { createOllamaClient } from "../adapters/ollama/ollama-client";
import { getErrorMessage } from "../core/errors";
import { loadFloatingChatPreferences, updateFloatingChatPreferences } from "../core/floating-preferences";
import {
  appendAssistantDelta,
  completeAssistantTurn,
  createEmptyChatState,
  failAssistantTurn,
  mergeClosedFloatingThread,
  renameThreadInState,
  removeThreadFromState,
  startAssistantTurn,
  startUserTurn,
} from "../core/chat-state";
import { canSubmitLocalLlmChat, getEffectiveModel, getLlmConnectionStatus } from "../core/setup-state";
import {
  CHAT_SIDEBAR_MIN_WIDTH,
  clampSidebarWidth,
  getSidebarWidthStorage,
  loadSidebarWidthPreference,
  saveSidebarWidthPreference,
} from "../core/sidebar-preferences";
import type { ChatHistoryStore, ChatMessage, ChatModelSettings, ChatState, ChatThread } from "../core/types";
import { ChatComposer } from "./ChatComposer";
import { ChatFloatingButton } from "./ChatFloatingButton";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSettingsDialog } from "./ChatSettingsDialog";
import { ChatSidebar } from "./ChatSidebar";
import { ChatStatusBar } from "./ChatStatusBar";

export type ChatShellProps = {
  modelError?: string | null;
  models?: string[];
  onRefreshModels?: () => void;
  onSettingsChange: (settings: ChatModelSettings) => void;
  settings: ChatModelSettings;
  store?: ChatHistoryStore;
};

export function ChatShell({
  modelError,
  models,
  onRefreshModels,
  onSettingsChange,
  settings,
  store,
}: ChatShellProps) {
  const fallbackStore = useMemo(() => createMemoryHistoryStore(settings), [settings]);
  const historyStore = store ?? fallbackStore;
  const [state, setState] = useState<ChatState>(() => createEmptyChatState());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => loadSidebarWidthPreference());
  const [deleteTarget, setDeleteTarget] = useState<ChatThread | null>(null);
  const [floatingPreferences, setFloatingPreferences] = useState(() => loadFloatingChatPreferences());
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const resizeRef = useRef<{ pointerId: number; startWidth: number; startX: number } | null>(null);
  const threadSelectionRequestRef = useRef(0);
  const activeMessages = state.activeThreadId ? state.messagesByThread[state.activeThreadId] ?? [] : [];
  const isThreadLoading = loadingThreadId !== null;
  const model = getEffectiveModel(settings);
  const connectionStatus = getLlmConnectionStatus(settings);
  const client = useMemo(() => createOllamaClient({ baseUrl: settings.baseUrl }), [settings.baseUrl]);
  const sidebarMaxWidth =
    typeof window === "undefined" ? 420 : Math.max(CHAT_SIDEBAR_MIN_WIDTH, Math.floor(window.innerWidth * 0.35));
  const shellStyle = {
    "--kmsf-chat-sidebar-width": `${sidebarWidth}px`,
  } as CSSProperties;

  useEffect(() => {
    let cancelled = false;

    async function loadThreads() {
      const result = await historyStore.loadThreads();

      if (!cancelled) {
        setState((current) => ({
          ...current,
          threads: result.items,
        }));
      }
    }

    void loadThreads();

    return () => {
      cancelled = true;
    };
  }, [historyStore]);

  useEffect(() => {
    function syncWidthToViewport() {
      setSidebarWidth((current) => {
        const next = clampSidebarWidth({ viewportWidth: window.innerWidth, width: current });
        if (next !== current) {
          saveSidebarWidthPreference(getSidebarWidthStorage(), next);
        }
        return next;
      });
    }

    window.addEventListener("resize", syncWidthToViewport);
    return () => window.removeEventListener("resize", syncWidthToViewport);
  }, []);

  async function send(content: string) {
    if (!model) {
      return;
    }
    const now = new Date().toISOString();
    const threadId = state.activeThreadId ?? `thread-${Date.now()}`;
    const userMessageId = `message-user-${Date.now()}`;
    const assistantMessageId = `message-assistant-${Date.now()}`;
    const withUser = startUserTurn(state, {
      content,
      messageId: userMessageId,
      now,
      threadId,
    });
    const pending = startAssistantTurn(withUser, {
      messageId: assistantMessageId,
      now: new Date().toISOString(),
    });
    setState(pending);

    try {
      const result = await client.streamChat({
        messages: toOllamaMessages(pending.messagesByThread[threadId] ?? []),
        model,
      });
      const streamed = appendAssistantDelta(pending, {
        content: result.content,
        messageId: assistantMessageId,
        now: new Date().toISOString(),
        thinking: result.thinking,
      });
      const completed = completeAssistantTurn(streamed, {
        messageId: assistantMessageId,
        now: new Date().toISOString(),
      });
      setState(completed);
      await persistThread(historyStore, completed, threadId);
    } catch (error) {
      const failed = failAssistantTurn(pending, {
        error: getErrorMessage(error) || "응답 생성 실패",
        messageId: assistantMessageId,
        now: new Date().toISOString(),
      });
      setState(failed);
      await persistThread(historyStore, failed, threadId);
    }
  }

  function startNewChat() {
    threadSelectionRequestRef.current += 1;
    setLoadingThreadId(null);
    setState((current) => ({ ...current, activeThreadId: null, error: null, pendingAssistantMessageId: null }));
  }

  async function selectThread(threadId: string) {
    const requestId = threadSelectionRequestRef.current + 1;
    threadSelectionRequestRef.current = requestId;
    const existingMessages = state.messagesByThread[threadId];

    if (existingMessages) {
      setLoadingThreadId(null);
      setState((current) => ({ ...current, activeThreadId: threadId }));
      return;
    }

    setLoadingThreadId(threadId);
    setState((current) => ({ ...current, activeThreadId: threadId, error: null }));
    try {
      const result = await historyStore.loadMessages(threadId);
      if (threadSelectionRequestRef.current !== requestId) {
        return;
      }
      setState((current) => ({
        ...current,
        activeThreadId: threadId,
        error: result.error?.message ?? current.error,
        messagesByThread: {
          ...current.messagesByThread,
          [threadId]: result.items,
        },
      }));
    } catch (error) {
      if (threadSelectionRequestRef.current !== requestId) {
        return;
      }
      setState((current) => ({ ...current, error: getErrorMessage(error) || "대화 불러오기 실패" }));
    } finally {
      if (threadSelectionRequestRef.current === requestId) {
        setLoadingThreadId(null);
      }
    }
  }

  function saveFloatingSession(thread: ChatThread, messages: ChatMessage[]) {
    setState((current) => ({
      ...current,
      messagesByThread: {
        ...current.messagesByThread,
        [thread.id]: messages,
      },
      threads: mergeClosedFloatingThread(current.threads, thread, messages),
    }));
  }

  async function confirmDeleteThread() {
    if (!deleteTarget) {
      return;
    }

    const threadId = deleteTarget.id;
    threadSelectionRequestRef.current += 1;
    setLoadingThreadId((current) => (current === threadId ? null : current));
    setState((current) => removeThreadFromState(current, threadId));
    await historyStore.deleteMessages(threadId);
    await historyStore.deleteThread(threadId);
    setDeleteTarget(null);
  }

  async function renameThread(thread: ChatThread, title: string) {
    const next = renameThreadInState(state, {
      now: new Date().toISOString(),
      threadId: thread.id,
      title,
    });

    setState(next);
    await historyStore.saveThreads(next.threads);
  }

  function setFloatingVisible(visible: boolean) {
    setFloatingPreferences(updateFloatingChatPreferences({ visible }));
  }

  function handleResizePointerDown(event: PointerEvent<HTMLDivElement>) {
    resizeRef.current = {
      pointerId: event.pointerId,
      startWidth: sidebarWidth,
      startX: event.clientX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizePointerMove(event: PointerEvent<HTMLDivElement>) {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) {
      return;
    }

    const next = clampSidebarWidth({
      viewportWidth: window.innerWidth,
      width: resize.startWidth + event.clientX - resize.startX,
    });
    setSidebarWidth(next);
  }

  function handleResizePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) {
      return;
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }

    const next = clampSidebarWidth({
      viewportWidth: window.innerWidth,
      width: resize.startWidth + event.clientX - resize.startX,
    });
    saveSidebarWidthPreference(getSidebarWidthStorage(), next);
    resizeRef.current = null;
  }

  return (
    <div className="kmsf-chat-shell" data-sidebar-collapsed={sidebarCollapsed} style={shellStyle}>
      <ChatSidebar
        activeThreadId={state.activeThreadId}
        collapsed={sidebarCollapsed}
        connectionStatus={connectionStatus}
        threads={state.threads}
        onDeleteThread={setDeleteTarget}
        onNewChat={startNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onRenameThread={(thread, title) => void renameThread(thread, title)}
        onSelectThread={(threadId) => void selectThread(threadId)}
        onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div
        aria-label="채팅 목록 너비 조절"
        aria-orientation="vertical"
        aria-valuemax={sidebarMaxWidth}
        aria-valuemin={CHAT_SIDEBAR_MIN_WIDTH}
        aria-valuenow={sidebarWidth}
        className="kmsf-chat-sidebar-resizer"
        role="separator"
        tabIndex={sidebarCollapsed ? -1 : 0}
        onPointerCancel={handleResizePointerEnd}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerEnd}
      />
      <main className="kmsf-chat-main" aria-label="활성 채팅" aria-busy={isThreadLoading ? "true" : "false"}>
        <header className="kmsf-chat-main__header">
          <div>
            <h1>Local LLM Chat</h1>
            <ChatStatusBar settings={settings} />
          </div>
          <button
            aria-label={floatingPreferences.visible ? "챗봇 버튼 숨기기" : "챗봇 버튼 표시"}
            aria-pressed={floatingPreferences.visible}
            className="kmsf-chat-toggle-button"
            type="button"
            onClick={() => setFloatingVisible(!floatingPreferences.visible)}
          >
            {floatingPreferences.visible ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{floatingPreferences.visible ? "챗봇 숨김" : "챗봇 표시"}</span>
          </button>
        </header>
        <ChatMessageList messages={activeMessages} />
        {isThreadLoading ? (
          <div className="kmsf-chat-main__loading" role="status" aria-label="채팅 메시지 로딩 중">
            <span className="kmsf-chat-spinner" aria-hidden="true" />
          </div>
        ) : null}
        <ChatComposer disabled={!canSubmitLocalLlmChat(settings) || isThreadLoading} onSend={send} />
      </main>
      <ChatSettingsDialog
        modelError={modelError}
        models={models}
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onRefreshModels={onRefreshModels}
        onSave={(next) => {
          onSettingsChange(next);
          setSettingsOpen(false);
        }}
      />
      {floatingPreferences.visible ? (
        <ChatFloatingButton
          client={client}
          settings={settings}
          store={historyStore}
          onSessionSaved={saveFloatingSession}
        />
      ) : null}
      {deleteTarget ? (
        <div className="kmsf-chat-dialog" role="dialog" aria-modal="true" aria-label="채팅 삭제">
          <div className="kmsf-chat-dialog__panel">
            <h2>채팅 삭제</h2>
            <p className="kmsf-chat-dialog__description">
              이 대화와 메시지를 영구 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="kmsf-chat-dialog__actions">
              <button type="button" onClick={() => setDeleteTarget(null)}>
                취소
              </button>
              <button className="kmsf-chat-danger-button" type="button" onClick={() => void confirmDeleteThread()}>
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toOllamaMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      content: message.content,
      role: message.role,
    }));
}

async function persistThread(store: ChatHistoryStore, state: ChatState, threadId: string) {
  await store.saveThreads(state.threads);
  await store.saveMessages(threadId, state.messagesByThread[threadId] ?? []);
}

function createMemoryHistoryStore(settings: ChatModelSettings): ChatHistoryStore {
  let threads: ChatThread[] = [];
  let currentSettings = settings;
  const messagesByThread = new Map<string, ChatMessage[]>();

  return {
    deleteMessages(threadId: string) {
      messagesByThread.delete(threadId);
    },
    deleteThread(threadId: string) {
      threads = threads.filter((thread) => thread.id !== threadId);
    },
    loadMessages(threadId: string) {
      return { items: messagesByThread.get(threadId) ?? [] };
    },
    loadSettings() {
      return { item: currentSettings };
    },
    loadThreads() {
      return { items: threads };
    },
    saveMessages(threadId: string, messages: ChatMessage[]) {
      messagesByThread.set(threadId, messages);
    },
    saveSettings(nextSettings: ChatModelSettings) {
      currentSettings = nextSettings;
    },
    saveThreads(nextThreads: ChatThread[]) {
      threads = nextThreads;
    },
  };
}
