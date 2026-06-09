import type { FormEvent } from "react";
import { useState } from "react";

import { X } from "lucide-react";

import type { ChatModelSettings } from "../core/types";

export type ChatSettingsDialogProps = {
  onClose: () => void;
  onSave: (settings: ChatModelSettings) => void;
  open: boolean;
  settings: ChatModelSettings;
};

export function ChatSettingsDialog({ onClose, onSave, open, settings }: ChatSettingsDialogProps) {
  const [draft, setDraft] = useState(settings);

  if (!open) {
    return null;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(draft);
  }

  return (
    <div className="kmsf-chat-dialog" role="dialog" aria-modal="true" aria-label="채팅 설정">
      <form className="kmsf-chat-dialog__panel" onSubmit={submit}>
        <div className="kmsf-chat-row">
          <h2>Chat Settings</h2>
          <button className="kmsf-chat-icon-button" type="button" aria-label="닫기" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <label className="kmsf-chat-field">
          <span>Ollama URL</span>
          <input
            aria-label="Ollama URL"
            value={draft.baseUrl}
            onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
          />
        </label>
        <label className="kmsf-chat-field">
          <span>수동 모델명</span>
          <input
            aria-label="수동 모델명"
            value={draft.manualModelName ?? ""}
            onChange={(event) =>
              setDraft({
                ...draft,
                manualModelName: event.target.value,
                selectedModel: null,
              })
            }
          />
        </label>
        <div className="kmsf-chat-dialog__actions">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button className="kmsf-chat-primary" type="submit">
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
