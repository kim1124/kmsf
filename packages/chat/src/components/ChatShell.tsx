import { useMemo, useState } from "react";
import { Settings } from "lucide-react";

import { createOllamaClient } from "../adapters/ollama/ollama-client";
import {
  appendAssistantDelta,
  completeAssistantTurn,
  createEmptyChatState,
  failAssistantTurn,
  startAssistantTurn,
  startUserTurn,
} from "../core/chat-state";
import { getEffectiveModel } from "../core/setup-state";
import type { ChatMessage, ChatModelSettings, ChatState } from "../core/types";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { ChatSettingsDialog } from "./ChatSettingsDialog";
import { ChatSidebar } from "./ChatSidebar";
import { ChatStatusBar } from "./ChatStatusBar";

export type ChatShellProps = {
  onSettingsChange: (settings: ChatModelSettings) => void;
  settings: ChatModelSettings;
};

export function ChatShell({ onSettingsChange, settings }: ChatShellProps) {
  const [state, setState] = useState<ChatState>(() => createEmptyChatState());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const activeMessages = state.activeThreadId ? state.messagesByThread[state.activeThreadId] ?? [] : [];
  const model = getEffectiveModel(settings);
  const client = useMemo(() => createOllamaClient({ baseUrl: settings.baseUrl }), [settings.baseUrl]);

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
      setState(
        completeAssistantTurn(streamed, {
          messageId: assistantMessageId,
          now: new Date().toISOString(),
        }),
      );
    } catch (error) {
      setState(
        failAssistantTurn(pending, {
          error: error instanceof Error ? error.message : "응답 생성 실패",
          messageId: assistantMessageId,
          now: new Date().toISOString(),
        }),
      );
    }
  }

  return (
    <div className="kmsf-chat-shell">
      <ChatSidebar activeThreadId={state.activeThreadId} threads={state.threads} onNewChat={() => setState(createEmptyChatState())} />
      <main className="kmsf-chat-main">
        <header className="kmsf-chat-main__header">
          <div>
            <h1>Local LLM Chat</h1>
            <ChatStatusBar settings={settings} />
          </div>
          <button className="kmsf-chat-settings-button" type="button" onClick={() => setSettingsOpen(true)}>
            <Settings size={16} />
            설정
          </button>
        </header>
        <ChatMessageList messages={activeMessages} />
        <ChatComposer disabled={!model} onSend={send} />
      </main>
      <ChatSettingsDialog
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={(next) => {
          onSettingsChange(next);
          setSettingsOpen(false);
        }}
      />
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
