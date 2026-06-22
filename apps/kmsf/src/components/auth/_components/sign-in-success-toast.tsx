"use client";

import { useEffect, useState } from "react";

type SignInSuccessToastProps = {
  message: string | null;
};

export function SignInSuccessToast({ message }: SignInSuccessToastProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) {
      return;
    }

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.hash}`);
  }, [message]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div
      className="fixed right-4 top-4 z-50 max-w-[calc(100vw-2rem)] rounded-[var(--kmsf-radius-md)] border border-border bg-white px-4 py-3 text-sm font-medium text-foreground shadow-[var(--kmsf-shadow-overlay)]"
      role="status"
    >
      {message}
      <button
        aria-label="알림 닫기"
        className="ml-3 text-foreground/55 transition-colors hover:text-foreground"
        onClick={() => setVisible(false)}
        type="button"
      >
        닫기
      </button>
    </div>
  );
}
