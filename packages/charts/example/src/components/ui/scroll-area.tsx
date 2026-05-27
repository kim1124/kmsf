import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../../lib/utils";

export function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root className={cn("ui-scroll-area", className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="ui-scroll-area__viewport">{children}</ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

export function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className={cn("ui-scroll-area__scrollbar", `ui-scroll-area__scrollbar--${orientation}`, className)}
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb className="ui-scroll-area__thumb" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}
