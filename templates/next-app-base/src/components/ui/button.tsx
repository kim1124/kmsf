import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all outline-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-foreground shadow-[0_10px_24px_rgba(15,23,42,0.18)] hover:bg-accent/90",
        secondary:
          "border border-border bg-panel text-foreground hover:bg-panel-hover",
        destructive:
          "border border-red-300 bg-red-500 text-white shadow-[0_10px_24px_rgba(239,68,68,0.18)] hover:bg-red-600 dark:border-red-400/30 dark:bg-red-500 dark:hover:bg-red-400",
        ghost: "text-foreground hover:bg-panel-hover",
        outline: "border border-border bg-transparent text-foreground hover:bg-panel-hover hover:text-foreground",
      },
      size: {
        sm: "h-10 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  );
}
