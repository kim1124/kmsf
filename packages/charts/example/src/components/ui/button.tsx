import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../../lib/utils";

const buttonVariants = cva("ui-button", {
  variants: {
    size: {
      icon: "ui-button--icon",
      sm: "ui-button--sm",
      md: "ui-button--md",
    },
    variant: {
      danger: "ui-button--danger",
      ghost: "ui-button--ghost",
      outline: "ui-button--outline",
      primary: "ui-button--primary",
      secondary: "ui-button--secondary",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "primary",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ asChild, className, size, type = "button", variant, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return <Comp className={cn(buttonVariants({ size, variant }), className)} type={type} {...props} />;
}
