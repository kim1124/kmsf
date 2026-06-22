import type { FormEvent } from "react";

import { Database, HardDrive, RefreshCw, Server } from "lucide-react";

import { canSubmitPrompt } from "../core/setup-state";
import type { ChatModelSettings } from "../core/types";

export type ChatSetupPageProps = {
  modelError?: string | null;
  models: string[];
  onRefreshModels?: () => void;
  onSettingsChange: (settings: ChatModelSettings) => void;
  onSubmit: () => void;
  settings: ChatModelSettings;
};

export function ChatSetupPage({
  modelError,
  models,
  onRefreshModels,
  onSettingsChange,
  onSubmit,
  settings,
}: ChatSetupPageProps) {
  const canStart = canSubmitPrompt(settings);

  function update(next: Partial<ChatModelSettings>) {
    onSettingsChange({ ...settings, ...next });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canStart) {
      onSubmit();
    }
  }

  return (
    <main className="kmsf-chat-setup">
      <form className="kmsf-chat-setup__panel" onSubmit={submit}>
        <div className="kmsf-chat-setup__header">
          <p className="kmsf-chat-eyebrow">Local LLM</p>
          <h1>@kmsf/chat</h1>
          <p>로컬 Ollama 모델과 저장소 방식을 선택합니다.</p>
        </div>

        <label className="kmsf-chat-field">
          <span>Ollama URL</span>
          <input
            aria-label="Ollama URL"
            value={settings.baseUrl}
            onChange={(event) => update({ baseUrl: event.target.value })}
          />
        </label>

        <div className="kmsf-chat-field">
          <div className="kmsf-chat-row">
            <label htmlFor="kmsf-chat-model">모델 선택</label>
            <button className="kmsf-chat-icon-button" type="button" aria-label="모델 새로고침" onClick={onRefreshModels}>
              <RefreshCw size={16} />
            </button>
          </div>
          <select
            id="kmsf-chat-model"
            aria-label="모델 선택"
            value={settings.selectedModel ?? ""}
            onChange={(event) =>
              update({
                manualModelName: "",
                selectedModel: event.target.value || null,
              })
            }
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
          <input
            aria-label="수동 모델명"
            placeholder="예: llama3.2"
            value={settings.manualModelName ?? ""}
            onChange={(event) =>
              update({
                manualModelName: event.target.value,
                selectedModel: null,
              })
            }
          />
        </label>

        <fieldset className="kmsf-chat-storage">
          <legend>저장소</legend>
          <label>
            <input
              checked={settings.storageMode === "local"}
              name="storageMode"
              type="radio"
              onChange={() => update({ storageMode: "local" })}
            />
            <HardDrive size={16} />
            Local
          </label>
          <label>
            <input
              checked={settings.storageMode === "supabase"}
              name="storageMode"
              type="radio"
              onChange={() => update({ storageMode: "supabase" })}
            />
            <Database size={16} />
            Supabase
          </label>
          <label>
            <input
              checked={settings.storageMode === "local-db"}
              name="storageMode"
              type="radio"
              onChange={() => update({ storageMode: "local-db" })}
            />
            <Server size={16} />
            Local DB
          </label>
        </fieldset>

        <button className="kmsf-chat-primary" disabled={!canStart} type="submit">
          채팅 시작
        </button>
      </form>
    </main>
  );
}
