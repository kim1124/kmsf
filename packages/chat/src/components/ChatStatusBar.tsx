import { Circle, Database, HardDrive } from "lucide-react";

import { getEffectiveModel } from "../core/setup-state";
import type { ChatModelSettings } from "../core/types";

export type ChatStatusBarProps = {
  settings: ChatModelSettings;
};

export function ChatStatusBar({ settings }: ChatStatusBarProps) {
  const model = getEffectiveModel(settings) ?? "모델 미선택";
  const StorageIcon = settings.storageMode === "supabase" ? Database : HardDrive;

  return (
    <div className="kmsf-chat-status">
      <span>
        <Circle size={10} />
        {model}
      </span>
      <span>
        <StorageIcon size={14} />
        {settings.storageMode}
      </span>
    </div>
  );
}
