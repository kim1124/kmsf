import { z } from "zod";
import { httpClient } from "../utils/http-client";

const settingsSchema = z.object({
  apiBaseUrl: z.string().url(),
});

export function SettingsPage() {
  const parsed = settingsSchema.safeParse({
    apiBaseUrl: httpClient.defaults.baseURL,
  });

  return (
    <section className="page-section">
      <p className="eyebrow">Settings</p>
      <h1>Starter settings</h1>
      <dl className="settings-list">
        <div>
          <dt>HTTP base URL</dt>
          <dd>{parsed.success ? parsed.data.apiBaseUrl : "Invalid API base URL"}</dd>
        </div>
        <div>
          <dt>Auth mode</dt>
          <dd>Manual or disabled</dd>
        </div>
      </dl>
    </section>
  );
}
