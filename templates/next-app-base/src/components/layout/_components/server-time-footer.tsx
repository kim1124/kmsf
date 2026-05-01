"use client";

import { useEffect, useMemo, useState } from "react";

import { formatServerTimeLabel } from "@/components/layout/app-shell.utils";

type ServerTimeFooterProps = {
  initialServerTime: number;
};

export function ServerTimeFooter({ initialServerTime }: ServerTimeFooterProps) {
  const [currentTime, setCurrentTime] = useState(initialServerTime);

  useEffect(() => {
    const mountedAt = Date.now();
    const timer = window.setInterval(() => {
      setCurrentTime(initialServerTime + (Date.now() - mountedAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [initialServerTime]);

  const label = useMemo(() => formatServerTimeLabel(new Date(currentTime)), [currentTime]);

  return <p className="ml-[10px] text-sm text-foreground/65">{label}</p>;
}
