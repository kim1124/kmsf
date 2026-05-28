"use client";

import { CircleHelp } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type FieldWithTooltipProps = {
  id: string;
  label: string;
  name: string;
  tooltip: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  errorText?: string | null;
  tooltipTrigger?: "icon" | "input";
};

export function FieldWithTooltip({
  id,
  label,
  name,
  tooltip,
  type = "text",
  placeholder,
  autoComplete,
  maxLength,
  defaultValue,
  value,
  onChange,
  errorText,
  tooltipTrigger = "input",
}: FieldWithTooltipProps) {
  const errorId = errorText ? `${id}-error` : undefined;
  const input = (className?: string) => (
    <Input
      aria-describedby={errorId}
      aria-invalid={Boolean(errorText)}
      autoComplete={autoComplete}
      className={className}
      defaultValue={defaultValue}
      id={id}
      maxLength={maxLength}
      name={name}
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={onChange}
    />
  );

  return (
    <div>
      <label className="mb-[10px] block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <TooltipProvider>
        <Tooltip>
          {tooltipTrigger === "icon" ? (
            <div className="relative">
              {input("pr-10")}
              <TooltipTrigger asChild>
                <button
                  aria-label={`${label} 도움말`}
                  className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-foreground/45 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                  type="button"
                >
                  <CircleHelp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
            </div>
          ) : (
            <TooltipTrigger asChild>
              <span className="block">{input()}</span>
            </TooltipTrigger>
          )}
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {errorText ? (
        <p className="mt-[10px] text-sm text-red-600" id={errorId}>
          {errorText}
        </p>
      ) : null}
    </div>
  );
}
