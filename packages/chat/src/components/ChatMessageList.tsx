import type { ChatMessage } from "../core/types";

export type ChatMessageListProps = {
  messages: ChatMessage[];
};

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <section className="kmsf-chat-messages" aria-label="대화 내용">
      {messages.length === 0 ? (
        <div className="kmsf-chat-empty">대화를 시작하려면 메시지를 입력하세요.</div>
      ) : (
        messages.map((message) => (
          <article className={`kmsf-chat-message kmsf-chat-message--${message.role}`} key={message.id}>
            {message.status === "pending" && message.role === "assistant" ? (
              <PendingDots />
            ) : (
              <p>{message.content}</p>
            )}
            {message.error ? <span className="kmsf-chat-error">{message.error}</span> : null}
          </article>
        ))
      )}
    </section>
  );
}

export function PendingDots() {
  return (
    <span className="kmsf-chat-pending-dots" aria-label="응답 생성 중">
      <span />
      <span />
      <span />
    </span>
  );
}
