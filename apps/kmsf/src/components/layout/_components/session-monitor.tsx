"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import {
  APP_SESSION_HEARTBEAT_INTERVAL_MS,
  APP_SESSION_IDLE_TIMEOUT_MS,
  formatAppSessionExpiryRoute,
} from "@/lib/auth/app-session";

const CLIENT_LAST_ACTIVITY_KEY = "kmsf:last-activity-at";

type SessionMonitorProps = {
  expiryReason?: "session-expired" | "session-reset";
};

export function SessionMonitor({ expiryReason = "session-expired" }: SessionMonitorProps) {
  const lastActivityAtRef = useRef(0);
  const lastHeartbeatAtRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);

  const redirectToExpiry = useEffectEvent(() => {
    window.location.assign(formatAppSessionExpiryRoute(expiryReason));
  });

  const sendHeartbeat = useEffectEvent(async (force = false) => {
    const now = Date.now();

    if (!force && now - lastHeartbeatAtRef.current < APP_SESSION_HEARTBEAT_INTERVAL_MS) {
      return;
    }

    lastHeartbeatAtRef.current = now;

    try {
      await fetch("/api/session/touch", {
        method: "POST",
        keepalive: true,
        credentials: "same-origin",
      });
    } catch {
      redirectToExpiry();
    }
  });

  const scheduleIdleTimeout = useEffectEvent(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
    }

    const remaining = APP_SESSION_IDLE_TIMEOUT_MS - (Date.now() - lastActivityAtRef.current);

    if (remaining <= 0) {
      redirectToExpiry();
      return;
    }

    idleTimerRef.current = window.setTimeout(() => {
      redirectToExpiry();
    }, remaining);
  });

  const markActivity = useEffectEvent(() => {
    const now = Date.now();
    lastActivityAtRef.current = now;
    window.sessionStorage.setItem(CLIENT_LAST_ACTIVITY_KEY, String(now));
    void sendHeartbeat();
    scheduleIdleTimeout();
  });

  useEffect(() => {
    const stored = Number(window.sessionStorage.getItem(CLIENT_LAST_ACTIVITY_KEY) ?? "");
    const initialActivityAt = Date.now();

    if (Number.isFinite(stored) && stored > 0) {
      lastActivityAtRef.current = stored;
    } else {
      lastActivityAtRef.current = initialActivityAt;
      window.sessionStorage.setItem(CLIENT_LAST_ACTIVITY_KEY, String(initialActivityAt));
    }

    if (Date.now() - lastActivityAtRef.current >= APP_SESSION_IDLE_TIMEOUT_MS) {
      redirectToExpiry();
      return;
    }

    void sendHeartbeat(true);
    scheduleIdleTimeout();

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousedown",
      "mousemove",
      "keydown",
      "wheel",
      "touchstart",
    ];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (Date.now() - lastActivityAtRef.current >= APP_SESSION_IDLE_TIMEOUT_MS) {
        redirectToExpiry();
        return;
      }

      markActivity();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }

      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, markActivity);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
