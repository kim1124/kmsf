import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Database, HardDrive, RefreshCw, Server, X } from "lucide-react";

import { selectDiscoveredModel } from "../core/settings-state";
import type { ChatModelSettings } from "../core/types";

export type ChatSettingsDialogProps = {
  modelError?: string | null;
  models?: string[];
  onClose: () => void;
  onRefreshModels?: () => void;
  onSave: (settings: ChatModelSettings) => void;
  open: boolean;
  settings: ChatModelSettings;
};

export function ChatSettingsDialog({
  modelError,
  models = [],
  onClose,
  onRefreshModels,
  onSave,
  open,
  settings,
}: ChatSettingsDialogProps) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    if (open) {
      setDraft(settings);
    }
  }, [open, settings]);

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
        <div className="kmsf-chat-field">
          <div className="kmsf-chat-row">
            <label htmlFor="kmsf-chat-settings-model">Ollama 모델</label>
            {onRefreshModels ? (
              <button className="kmsf-chat-icon-button" type="button" aria-label="설정 모델 새로고침" onClick={onRefreshModels}>
                <RefreshCw size={16} />
              </button>
            ) : null}
          </div>
          <select
            id="kmsf-chat-settings-model"
            aria-label="설정 모델 선택"
            value={draft.selectedModel ?? ""}
            onChange={(event) => setDraft(selectDiscoveredModel(draft, event.target.value))}
          >
            <option value="">모델을 선택하세요</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {modelError ? <p className="kmsf-chat-error">모델 목록을 불러올 수 없습니다.</p> : null}
        </div>
        <label className="kmsf-chat-field">
          <span>수동 모델명</span>
          <small>Ollama 모델 목록을 불러오지 못했거나 목록에 없는 모델을 사용할 때 입력하는 fallback입니다.</small>
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
        <fieldset className="kmsf-chat-storage">
          <legend>저장 방식</legend>
          <label className="kmsf-chat-storage-card">
            <input
              checked={draft.storageMode === "local"}
              name="settingsStorageMode"
              type="radio"
              onChange={() => setDraft({ ...draft, storageMode: "local" })}
            />
            <HardDrive size={16} />
            <span>
              <strong>Local Storage</strong>
              <small>브라우저 localStorage에 저장합니다.</small>
            </span>
          </label>
          <label className="kmsf-chat-storage-card">
            <input
              checked={draft.storageMode === "supabase"}
              name="settingsStorageMode"
              type="radio"
              onChange={() => setDraft({ ...draft, storageMode: "supabase" })}
            />
            <Database size={16} />
            <span>
              <strong>Supabase</strong>
              <small>서버 .env의 Secret Key는 서버에서만 사용합니다.</small>
              <small>브라우저에 Supabase Secret Key를 입력하거나 저장하지 않습니다.</small>
            </span>
          </label>
          <label className="kmsf-chat-storage-card">
            <input
              checked={draft.storageMode === "local-db"}
              name="settingsStorageMode"
              type="radio"
              onChange={() => setDraft({ ...draft, localDbType: "lowdb-json", storageMode: "local-db" })}
            />
            <Server size={16} />
            <span>
              <strong>Local DB</strong>
              <small>Host API와 서버 DB path를 host app adapter가 해석합니다.</small>
            </span>
          </label>
        </fieldset>
        {draft.storageMode === "local-db" ? (
          <div className="kmsf-chat-local-db-fields">
            <label className="kmsf-chat-field">
              <span>DB 종류</span>
              <select
                aria-label="DB 종류"
                value={draft.localDbType ?? "lowdb-json"}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    localDbType: event.target.value === "lowdb-json" ? "lowdb-json" : "lowdb-json",
                  })
                }
              >
                <option value="lowdb-json">lowdb JSON</option>
              </select>
            </label>
            <label className="kmsf-chat-field">
              <span>Host API endpoint</span>
              <input
                aria-label="Host API endpoint"
                placeholder="/api/kmsf/chat-history"
                value={draft.localDbEndpoint ?? ""}
                onChange={(event) => setDraft({ ...draft, localDbEndpoint: event.target.value })}
              />
            </label>
            <label className="kmsf-chat-field">
              <span>Server DB path</span>
              <input
                aria-label="Server DB path"
                placeholder="apps/kmsf/.local/chat.db.json"
                value={draft.localDbPath ?? ""}
                onChange={(event) => setDraft({ ...draft, localDbPath: event.target.value })}
              />
            </label>
          </div>
        ) : null}
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
