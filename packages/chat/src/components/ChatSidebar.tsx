import { useState } from "react";

import { ChevronsLeft, ChevronsRight, MessageSquarePlus, Pencil, Settings, Trash2 } from "lucide-react";

import type { ChatThread } from "../core/types";

type LlmConnectionStatus = {
  connected: boolean;
  connectedAt: string | null;
  label: string;
};

export type ChatSidebarProps = {
  activeThreadId: string | null;
  collapsed: boolean;
  connectionStatus: LlmConnectionStatus;
  onDeleteThread: (thread: ChatThread) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onRenameThread: (thread: ChatThread, title: string) => void;
  onSelectThread: (threadId: string) => void;
  onToggleCollapsed: () => void;
  threads: ChatThread[];
};

export function ChatSidebar({
  activeThreadId,
  collapsed,
  connectionStatus,
  onDeleteThread,
  onNewChat,
  onOpenSettings,
  onRenameThread,
  onSelectThread,
  onToggleCollapsed,
  threads,
}: ChatSidebarProps) {
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  function startRename(thread: ChatThread) {
    setEditingThreadId(thread.id);
    setDraftTitle(thread.title);
  }

  function cancelRename() {
    setEditingThreadId(null);
    setDraftTitle("");
  }

  function commitRename(thread: ChatThread) {
    if (editingThreadId !== thread.id) {
      return;
    }

    onRenameThread(thread, draftTitle);
    cancelRename();
  }

  return (
    <aside
      className="kmsf-chat-sidebar"
      aria-label="채팅 사이드바"
      data-collapsed={collapsed}
    >
      <div className="kmsf-chat-sidebar__header">
        <div className="kmsf-chat-sidebar__header-actions">
          <button className="kmsf-chat-sidebar__new" type="button" aria-label="새 채팅" onClick={onNewChat}>
            <MessageSquarePlus size={16} />
            {!collapsed ? <span>새 채팅</span> : null}
          </button>
          <button
            className="kmsf-chat-icon-button"
            type="button"
            aria-label={collapsed ? "채팅 목록 펼치기" : "채팅 목록 접기"}
            onClick={onToggleCollapsed}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>
      </div>
      <nav className="kmsf-chat-sidebar__list" aria-label="채팅 목록">
        {threads.length === 0 ? (
          <p className="kmsf-chat-sidebar__empty">저장된 대화가 없습니다.</p>
        ) : (
          threads.map((thread) => (
            <div className="kmsf-chat-thread-row" key={thread.id} data-active={thread.id === activeThreadId}>
              {editingThreadId === thread.id ? (
                <input
                  aria-label={`채팅 제목 입력: ${thread.title}`}
                  className="kmsf-chat-thread-rename"
                  value={draftTitle}
                  onBlur={() => commitRename(thread)}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitRename(thread);
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      cancelRename();
                    }
                  }}
                />
              ) : (
                <button
                  aria-current={thread.id === activeThreadId ? "page" : undefined}
                  aria-label={`채팅 열기: ${thread.title}`}
                  className={
                    thread.id === activeThreadId ? "is-active kmsf-chat-thread-select" : "kmsf-chat-thread-select"
                  }
                  data-active={thread.id === activeThreadId}
                  title={collapsed ? thread.title : undefined}
                  type="button"
                  onClick={() => onSelectThread(thread.id)}
                >
                  <span>{collapsed ? thread.title.slice(0, 1) : thread.title}</span>
                </button>
              )}
              <div className="kmsf-chat-thread-actions">
                <button
                  className="kmsf-chat-thread-action"
                  type="button"
                  aria-label={`채팅 제목 변경: ${thread.title}`}
                  onClick={() => startRename(thread)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="kmsf-chat-thread-action"
                  type="button"
                  aria-label={`채팅 삭제: ${thread.title}`}
                  onClick={() => onDeleteThread(thread)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </nav>
      <footer className="kmsf-chat-sidebar__footer">
        <section className="kmsf-chat-connection-card" aria-label="LLM 연결 상태">
          <p>
            <span>LLM 연결 :</span>
            <strong>
              <span
                className="kmsf-chat-connection-dot"
                data-connected={connectionStatus.connected}
                aria-hidden="true"
              />
              {connectionStatus.label}
            </strong>
          </p>
          <p>
            <span>연결 시간 :</span>
            <time>{connectionStatus.connectedAt ?? "-"}</time>
          </p>
        </section>
        <button className="kmsf-chat-settings-button" type="button" aria-label="채팅 설정 열기" onClick={onOpenSettings}>
          <Settings size={16} />
          {!collapsed ? <span>설정</span> : null}
        </button>
      </footer>
    </aside>
  );
}
