import type { ChatModelSettings } from "./types";

export function selectDiscoveredModel(settings: ChatModelSettings, model: string): ChatModelSettings {
  const selectedModel = model.trim() || null;

  return {
    ...settings,
    manualModelName: "",
    selectedModel,
  };
}
