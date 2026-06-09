import { describe, expect, it } from "vitest";

import {
  abortAssistantTurn,
  appendAssistantDelta,
  completeAssistantTurn,
  createEmptyChatState,
  failAssistantTurn,
  startAssistantTurn,
  startUserTurn,
} from "../../src/core/chat-state";

describe("chat state", () => {
  it("creates an empty state without an active thread", () => {
    const state = createEmptyChatState();

    expect(state.activeThreadId).toBeNull();
    expect(state.threads).toEqual([]);
    expect(state.messagesByThread).toEqual({});
  });

  it("creates a thread and appends a user message when no active thread exists", () => {
    const state = startUserTurn(createEmptyChatState(), {
      content: "안녕",
      messageId: "msg-user-1",
      now: "2026-06-08T00:00:00.000Z",
      threadId: "thread-1",
    });

    expect(state.activeThreadId).toBe("thread-1");
    expect(state.threads).toEqual([
      {
        createdAt: "2026-06-08T00:00:00.000Z",
        id: "thread-1",
        title: "안녕",
        updatedAt: "2026-06-08T00:00:00.000Z",
      },
    ]);
    expect(state.messagesByThread["thread-1"]).toMatchObject([
      {
        content: "안녕",
        id: "msg-user-1",
        role: "user",
        status: "complete",
      },
    ]);
  });

  it("tracks assistant streaming lifecycle", () => {
    const withUser = startUserTurn(createEmptyChatState(), {
      content: "테스트",
      messageId: "msg-user-1",
      now: "2026-06-08T00:00:00.000Z",
      threadId: "thread-1",
    });
    const pending = startAssistantTurn(withUser, {
      messageId: "msg-assistant-1",
      now: "2026-06-08T00:00:01.000Z",
    });
    const streamed = appendAssistantDelta(pending, {
      content: "응답",
      messageId: "msg-assistant-1",
      thinking: "생각",
      now: "2026-06-08T00:00:02.000Z",
    });
    const complete = completeAssistantTurn(streamed, {
      messageId: "msg-assistant-1",
      now: "2026-06-08T00:00:03.000Z",
    });

    expect(complete.pendingAssistantMessageId).toBeNull();
    expect(complete.messagesByThread["thread-1"][1]).toMatchObject({
      content: "응답",
      id: "msg-assistant-1",
      role: "assistant",
      status: "complete",
      thinking: "생각",
    });
  });

  it("records assistant failure and clears pending state", () => {
    const pending = startAssistantTurn(
      startUserTurn(createEmptyChatState(), {
        content: "실패 테스트",
        messageId: "msg-user-1",
        now: "2026-06-08T00:00:00.000Z",
        threadId: "thread-1",
      }),
      {
        messageId: "msg-assistant-1",
        now: "2026-06-08T00:00:01.000Z",
      },
    );

    const failed = failAssistantTurn(pending, {
      error: "Ollama 연결 실패",
      messageId: "msg-assistant-1",
      now: "2026-06-08T00:00:02.000Z",
    });

    expect(failed.pendingAssistantMessageId).toBeNull();
    expect(failed.messagesByThread["thread-1"][1]).toMatchObject({
      error: "Ollama 연결 실패",
      status: "error",
    });
  });

  it("marks an assistant message aborted without deleting streamed content", () => {
    const pending = appendAssistantDelta(
      startAssistantTurn(
        startUserTurn(createEmptyChatState(), {
          content: "중단 테스트",
          messageId: "msg-user-1",
          now: "2026-06-08T00:00:00.000Z",
          threadId: "thread-1",
        }),
        {
          messageId: "msg-assistant-1",
          now: "2026-06-08T00:00:01.000Z",
        },
      ),
      {
        content: "일부 응답",
        messageId: "msg-assistant-1",
        now: "2026-06-08T00:00:02.000Z",
      },
    );

    const aborted = abortAssistantTurn(pending, {
      messageId: "msg-assistant-1",
      now: "2026-06-08T00:00:03.000Z",
    });

    expect(aborted.pendingAssistantMessageId).toBeNull();
    expect(aborted.messagesByThread["thread-1"][1]).toMatchObject({
      content: "일부 응답",
      status: "aborted",
    });
  });
});
