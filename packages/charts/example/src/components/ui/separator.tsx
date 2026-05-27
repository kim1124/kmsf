import { Separator as SeparatorPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../../lib/utils";

export function Separator({
  className,
  decorative = true,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      className={cn("ui-separator", `ui-separator--${orientation}`, className)}
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  );
}
