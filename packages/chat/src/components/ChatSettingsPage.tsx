import type { ChatModelSettings } from "../core/types";

export type ChatSettingsPageProps = {
  settings: ChatModelSettings;
};

export function ChatSettingsPage({ settings }: ChatSettingsPageProps) {
  return (
    <section className="kmsf-chat-settings-page">
      <h2>Chat Settings</h2>
      <label className="kmsf-chat-field">
        <span>Ollama URL</span>
        <input aria-label="Ollama URL" readOnly value={settings.baseUrl} />
      </label>
      <label className="kmsf-chat-field">
        <span>현재 모델</span>
        <input aria-label="현재 모델" readOnly value={settings.manualModelName || settings.selectedModel || ""} />
      </label>
    </section>
  );
}
