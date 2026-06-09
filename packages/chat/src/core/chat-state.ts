import type { ChatMessage, ChatState, ChatThread } from "./types";

type Clocked = {
  now: string;
};

type MessageTarget = Clocked & {
  messageId: string;
};

type StartUserTurnInput = MessageTarget & {
  content: string;
  threadId?: string;
};

type AssistantDeltaInput = MessageTarget & {
  content?: string;
  thinking?: string;
};

type AssistantFailureInput = MessageTarget & {
  error: string;
};

export function createEmptyChatState(): ChatState {
  return {
    activeThreadId: null,
    error: null,
    messagesByThread: {},
    pendingAssistantMessageId: null,
    threads: [],
  };
}

export function startUserTurn(state: ChatState, input: StartUserTurnInput): ChatState {
  const threadId = state.activeThreadId ?? input.threadId;
  if (!threadId) {
    throw new Error("threadId is required when no active thread exists.");
  }

  const existingThread = state.threads.find((thread) => thread.id === threadId);
  const thread: ChatThread = existingThread ?? {
    createdAt: input.now,
    id: threadId,
    title: createThreadTitle(input.content),
    updatedAt: input.now,
  };
  const message: ChatMessage = {
    content: input.content,
    createdAt: input.now,
    id: input.messageId,
    role: "user",
    status: "complete",
    threadId,
    updatedAt: input.now,
  };

  return {
    ...state,
    activeThreadId: threadId,
    error: null,
    messagesByThread: appendMessage(state.messagesByThread, threadId, message),
    threads: upsertThread(state.threads, { ...thread, updatedAt: input.now }),
  };
}

export function startAssistantTurn(state: ChatState, input: MessageTarget): ChatState {
  const threadId = requireActiveThread(state);
  const message: ChatMessage = {
    content: "",
    createdAt: input.now,
    id: input.messageId,
    role: "assistant",
    status: "pending",
    threadId,
    updatedAt: input.now,
  };

  return {
    ...state,
    messagesByThread: appendMessage(state.messagesByThread, threadId, message),
    pendingAssistantMessageId: input.messageId,
    threads: touchThread(state.threads, threadId, input.now),
  };
}

export function appendAssistantDelta(state: ChatState, input: AssistantDeltaInput): ChatState {
  return updateAssistantMessage(state, input.messageId, input.now, (message) => ({
    ...message,
    content: `${message.content}${input.content ?? ""}`,
    thinking: `${message.thinking ?? ""}${input.thinking ?? ""}`,
    updatedAt: input.now,
  }));
}

export function completeAssistantTurn(state: ChatState, input: MessageTarget): ChatState {
  const updated = updateAssistantMessage(state, input.messageId, input.now, (message) => ({
    ...message,
    status: "complete",
    updatedAt: input.now,
  }));
  return { ...updated, pendingAssistantMessageId: null };
}

export function failAssistantTurn(state: ChatState, input: AssistantFailureInput): ChatState {
  const updated = updateAssistantMessage(state, input.messageId, input.now, (message) => ({
    ...message,
    error: input.error,
    status: "error",
    updatedAt: input.now,
  }));
  return { ...updated, error: input.error, pendingAssistantMessageId: null };
}

export function abortAssistantTurn(state: ChatState, input: MessageTarget): ChatState {
  const updated = updateAssistantMessage(state, input.messageId, input.now, (message) => ({
    ...message,
    status: "aborted",
    updatedAt: input.now,
  }));
  return { ...updated, pendingAssistantMessageId: null };
}

function requireActiveThread(state: ChatState) {
  if (!state.activeThreadId) {
    throw new Error("Active thread is required.");
  }
  return state.activeThreadId;
}

function createThreadTitle(content: string) {
  const title = content.trim().replace(/\s+/g, " ");
  return title.length > 32 ? `${title.slice(0, 32)}...` : title || "New chat";
}

function appendMessage(
  messagesByThread: Record<string, ChatMessage[]>,
  threadId: string,
  message: ChatMessage,
) {
  return {
    ...messagesByThread,
    [threadId]: [...(messagesByThread[threadId] ?? []), message],
  };
}

function upsertThread(threads: ChatThread[], thread: ChatThread) {
  const next = threads.filter((item) => item.id !== thread.id);
  return [thread, ...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function touchThread(threads: ChatThread[], threadId: string, now: string) {
  return threads.map((thread) => (thread.id === threadId ? { ...thread, updatedAt: now } : thread));
}

function updateAssistantMessage(
  state: ChatState,
  messageId: string,
  now: string,
  update: (message: ChatMessage) => ChatMessage,
): ChatState {
  const threadId = requireActiveThread(state);
  const messages = state.messagesByThread[threadId] ?? [];
  return {
    ...state,
    messagesByThread: {
      ...state.messagesByThread,
      [threadId]: messages.map((message) => (message.id === messageId ? update(message) : message)),
    },
    threads: touchThread(state.threads, threadId, now),
  };
}
