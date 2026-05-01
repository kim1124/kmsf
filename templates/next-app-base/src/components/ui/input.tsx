import type * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/40 focus-visible:ring-4 focus-visible:ring-ring dark:bg-surface",
        className,
      )}
      {...props}
    />
  );
}
