import type { CSSProperties, FormEvent, PointerEvent } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { MessageCircle, Send, X } from "lucide-react";

import { createOllamaClient } from "../adapters/ollama/ollama-client";
import { createFloatingThread, mergeClosedFloatingThread } from "../core/chat-state";
import { getErrorMessage } from "../core/errors";
import {
  clampFloatingPosition,
  calculateFloatingPanelPosition,
  getFloatingChatStorage,
  hasMovedPastDragThreshold,
  loadFloatingChatPreferences,
  updateFloatingChatPreferences,
  type FloatingChatPosition,
} from "../core/floating-preferences";
import { canSubmitLocalLlmChat, getEffectiveModel } from "../core/setup-state";
import type { ChatHistoryStore, ChatMessage, ChatModelSettings, ChatThread } from "../core/types";
import { PendingDots } from "./ChatMessageList";

type FloatingChatClient = {
  streamChat(input: {
    messages: Array<{ content: string; role: "assistant" | "user" }>;
    model: string;
    signal?: AbortSignal;
  }): Promise<{ content: string; thinking: string }>;
};

type FloatingPanelSize = {
  height: number;
  width: number;
};

const FLOATING_BUTTON_SIZE = 48;
const FLOATING_BUTTON_MARGIN = 16;
const FLOATING_BUTTON_RIGHT = 24;
const FLOATING_BUTTON_BOTTOM = 88;
const FLOATING_PANEL_GAP = 12;
const FLOATING_PANEL_HEIGHT = 280;
const FLOATING_PANEL_WIDTH = 360;
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type ChatFloatingButtonProps = {
  className?: string;
  client?: FloatingChatClient;
  onBackdropPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onSessionSaved?: (thread: ChatThread, messages: ChatMessage[]) => void;
  settings: ChatModelSettings;
  store: ChatHistoryStore;
};

export function ChatFloatingButton({
  className,
  client,
  onBackdropPointerDown,
  onSessionSaved,
  settings,
  store,
}: ChatFloatingButtonProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [panelSize, setPanelSize] = useState<FloatingPanelSize | null>(null);
  const [pending, setPending] = useState(false);
  const [position, setPosition] = useState<FloatingChatPosition | null>(() => getInitialFloatingPosition());
  const [thread, setThread] = useState<ChatThread | null>(null);
  const dragRef = useRef<{
    current: FloatingChatPosition;
    moved: boolean;
    origin: FloatingChatPosition;
    pointerId: number;
    start: FloatingChatPosition;
  } | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const suppressClickRef = useRef(false);
  const model = getEffectiveModel(settings);
  const panelLayoutSignature = messages
    .map((message) => `${message.id}:${message.status}:${message.content.length}:${message.error?.length ?? 0}`)
    .join("|");
  const chatClient = useMemo(
    () => client ?? createOllamaClient({ baseUrl: settings.baseUrl }),
    [client, settings.baseUrl],
  );
  const floatingStyle: CSSProperties | undefined = position
    ? {
        bottom: "auto",
        left: position.x,
        right: "auto",
        top: position.y,
      }
    : undefined;
  const panelStyle = position ? getFloatingPanelStyle(position, panelSize) : undefined;

  useBrowserLayoutEffect(() => {
    if (!open) {
      setPanelSize(null);
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    if (rect.height <= 0 || rect.width <= 0) {
      return;
    }

    setPanelSize((current) => {
      if (
        current &&
        Math.abs(current.height - rect.height) < 0.5 &&
        Math.abs(current.width - rect.width) < 0.5
      ) {
        return current;
      }

      return {
        height: rect.height,
        width: rect.width,
      };
    });
  }, [open, panelLayoutSignature, pending, position]);

  if (!canSubmitLocalLlmChat(settings) || !model) {
    return null;
  }

  function openSession() {
    setThread(createFloatingThread("Floating chat"));
    setMessages([]);
    setInput("");
    setOpen(true);
  }

  async function closeSession() {
    if (thread) {
      const title = createSavedTitle(messages);
      const savedThread = { ...thread, title };
      const savedThreads = mergeClosedFloatingThread(
        await resolveItems(store.loadThreads()),
        savedThread,
        messages,
      );

      await store.saveThreads(savedThreads);
      if (messages.length > 0) {
        await store.saveMessages(thread.id, messages);
        onSessionSaved?.(savedThreads[0] ?? savedThread, messages);
      }
    }

    setInput("");
    setMessages([]);
    setOpen(false);
    setPending(false);
    setThread(null);
  }

  function toggleSession() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    if (open) {
      void closeSession();
      return;
    }
    openSession();
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const origin = position ?? { x: rect.left, y: rect.top };

    dragRef.current = {
      current: origin,
      moved: false,
      origin,
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const pointer = { x: event.clientX, y: event.clientY };
    const moved = drag.moved || hasMovedPastDragThreshold(drag.start, pointer);
    const next = clampForViewport({
      x: drag.origin.x + pointer.x - drag.start.x,
      y: drag.origin.y + pointer.y - drag.start.y,
    });

    drag.current = next;
    drag.moved = moved;

    if (moved) {
      event.preventDefault();
      setPosition(next);
    }
  }

  function handlePointerEnd(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }

    if (drag.moved) {
      suppressClickRef.current = true;
      setPosition(drag.current);
      updateFloatingChatPreferences({ position: drag.current }, getFloatingChatStorage());
    }

    dragRef.current = null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    const selectedModel = getEffectiveModel(settings);

    if (!content || !thread || pending || !selectedModel) {
      return;
    }

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      content,
      createdAt: now,
      id: `message-${createId()}`,
      role: "user",
      status: "complete",
      threadId: thread.id,
      updatedAt: now,
    };
    const assistantMessage: ChatMessage = {
      content: "",
      createdAt: now,
      id: `message-${createId()}`,
      role: "assistant",
      status: "pending",
      threadId: thread.id,
      updatedAt: now,
    };
    const nextMessages = [...messages, userMessage, assistantMessage];

    setInput("");
    setMessages(nextMessages);
    setPending(true);
    setThread((current) => (current && messages.length === 0 ? { ...current, title: createTitle(content) } : current));

    try {
      const result = await chatClient.streamChat({
        messages: toOllamaMessages(nextMessages),
        model: selectedModel,
      });
      const completedAt = new Date().toISOString();
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: result.content,
                status: "complete",
                thinking: result.thinking,
                updatedAt: completedAt,
              }
            : message,
        ),
      );
    } catch (error) {
      const failedAt = new Date().toISOString();
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                error: getErrorMessage(error) || "응답 생성 실패",
                status: "error",
                updatedAt: failedAt,
              }
            : message,
        ),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={["kmsf-chat-floating", className].filter(Boolean).join(" ")} style={floatingStyle}>
      {open ? (
        <>
          <div
            className="kmsf-chat-floating__backdrop"
            aria-hidden="true"
            onPointerDown={onBackdropPointerDown}
          />
          <section
            className="kmsf-chat-floating__panel"
            ref={panelRef}
            role="dialog"
            aria-label="플로팅 채팅"
            style={panelStyle}
          >
            <div className="kmsf-chat-floating__messages">
              {messages.length === 0 ? (
                <p className="kmsf-chat-floating__empty">무엇을 도와드릴까요?</p>
              ) : (
                messages.map((message) => (
                  <article
                    className={`kmsf-chat-floating__bubble kmsf-chat-floating__bubble--${message.role}`}
                    key={message.id}
                  >
                    {message.status === "pending" && message.role === "assistant" ? (
                      <PendingDots />
                    ) : (
                      <p>{message.content}</p>
                    )}
                    {message.error ? <span className="kmsf-chat-error">{message.error}</span> : null}
                  </article>
                ))
              )}
            </div>
            <form className="kmsf-chat-floating__form" onSubmit={submit}>
              <input
                aria-label="플로팅 메시지 입력"
                disabled={pending}
                placeholder="메시지 입력"
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <button aria-label="플로팅 메시지 전송" disabled={pending || input.trim().length === 0} type="submit">
                <Send size={16} />
              </button>
            </form>
          </section>
        </>
      ) : null}
      <button
        className="kmsf-chat-floating__button"
        type="button"
        aria-label={open ? "플로팅 채팅 닫기" : "플로팅 채팅 열기"}
        data-hover-close={open ? "true" : "false"}
        onClick={toggleSession}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}

function createSavedTitle(messages: ChatMessage[]) {
  return createTitle(messages.find((message) => message.role === "user")?.content ?? "Floating chat");
}

function createTitle(content: string) {
  const title = content.trim().replace(/\s+/g, " ");
  return title.length > 32 ? `${title.slice(0, 32)}...` : title || "Floating chat";
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toOllamaMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .filter((message) => message.content.length > 0)
    .map((message) => ({
      content: message.content,
      role: message.role as "assistant" | "user",
    }));
}

async function resolveItems(result: ReturnType<ChatHistoryStore["loadThreads"]>) {
  return (await result).items;
}

function getInitialFloatingPosition() {
  const position = loadFloatingChatPreferences().position;
  if (position) {
    return clampForViewport(position);
  }

  if (typeof window === "undefined") {
    return null;
  }

  return clampForViewport({
    x: window.innerWidth - FLOATING_BUTTON_SIZE - FLOATING_BUTTON_RIGHT,
    y: window.innerHeight - FLOATING_BUTTON_SIZE - FLOATING_BUTTON_BOTTOM,
  });
}

function clampForViewport(position: FloatingChatPosition) {
  if (typeof window === "undefined") {
    return position;
  }

  return clampFloatingPosition({
    buttonSize: FLOATING_BUTTON_SIZE,
    margin: FLOATING_BUTTON_MARGIN,
    position,
    viewport: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
  });
}

function getFloatingPanelStyle(
  position: FloatingChatPosition,
  measuredPanelSize: FloatingPanelSize | null,
): CSSProperties | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const panelWidth = Math.min(FLOATING_PANEL_WIDTH, window.innerWidth - FLOATING_BUTTON_MARGIN * 2);
  const panelSize = measuredPanelSize ?? {
    height: FLOATING_PANEL_HEIGHT,
    width: panelWidth,
  };
  const panelPosition = calculateFloatingPanelPosition({
    buttonPosition: position,
    buttonSize: FLOATING_BUTTON_SIZE,
    gap: FLOATING_PANEL_GAP,
    margin: FLOATING_BUTTON_MARGIN,
    panelSize,
    viewport: {
      height: window.innerHeight,
      width: window.innerWidth,
    },
  });

  return {
    left: panelPosition.x,
    pointerEvents: measuredPanelSize ? undefined : "none",
    top: panelPosition.y,
    visibility: measuredPanelSize ? undefined : "hidden",
  };
}
