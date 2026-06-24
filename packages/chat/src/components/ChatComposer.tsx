import type { FormEvent, KeyboardEvent } from "react";
import { useState } from "react";

import { Send } from "lucide-react";

import { getComposerKeyAction } from "../core/composer-state";

export type ChatComposerProps = {
  disabled?: boolean;
  onSend: (content: string) => void;
};

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [content, setContent] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitContent();
  }

  function submitContent() {
    const next = content.trim();
    if (!next || disabled) {
      return;
    }
    onSend(next);
    setContent("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const action = getComposerKeyAction({
      isComposing: event.nativeEvent.isComposing,
      key: event.key,
      shiftKey: event.shiftKey,
    });

    if (action !== "submit") {
      return;
    }

    event.preventDefault();
    submitContent();
  }

  return (
    <form className="kmsf-chat-composer" onSubmit={submit}>
      <textarea
        aria-label="메시지 입력"
        disabled={disabled}
        placeholder="메시지를 입력하세요"
        value={content}
        onKeyDown={handleKeyDown}
        onChange={(event) => setContent(event.target.value)}
      />
      <button aria-label="전송" disabled={disabled || content.trim().length === 0} type="submit">
        <Send size={18} />
      </button>
    </form>
  );
}
