import { MessageSquarePlus } from "lucide-react";

import type { ChatThread } from "../core/types";

export type ChatSidebarProps = {
  activeThreadId: string | null;
  onNewChat: () => void;
  threads: ChatThread[];
};

export function ChatSidebar({ activeThreadId, onNewChat, threads }: ChatSidebarProps) {
  return (
    <aside className="kmsf-chat-sidebar">
      <button className="kmsf-chat-sidebar__new" type="button" onClick={onNewChat}>
        <MessageSquarePlus size={16} />
        새 채팅
      </button>
      <nav aria-label="대화 목록">
        {threads.map((thread) => (
          <button
            className={thread.id === activeThreadId ? "is-active" : undefined}
            key={thread.id}
            type="button"
          >
            {thread.title}
          </button>
        ))}
      </nav>
    </aside>
  );
}
