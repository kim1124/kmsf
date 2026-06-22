"use client";

import { useState } from "react";
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
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  errorText?: string | null;
  tooltipTrigger?: "icon";
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
  onBlur,
  errorText,
  tooltipTrigger = "icon",
}: FieldWithTooltipProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const errorId = errorText ? `${id}-error` : undefined;
  const renderIconTrigger = tooltipTrigger === "icon";
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
      onBlur={onBlur}
      onChange={onChange}
    />
  );

  return (
    <div>
      <label className="mb-[10px] block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <TooltipProvider>
        <Tooltip open={tooltipOpen}>
          {renderIconTrigger ? (
            <div className="relative">
              {input("pr-10")}
              <TooltipTrigger asChild>
                <button
                  aria-label={`${label} 도움말`}
                  className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-foreground/45 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                  type="button"
                  onBlur={() => setTooltipOpen(false)}
                  onFocus={() => setTooltipOpen(false)}
                  onPointerEnter={() => setTooltipOpen(true)}
                  onPointerLeave={() => setTooltipOpen(false)}
                  onPointerMove={() => setTooltipOpen(true)}
                >
                  <CircleHelp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
            </div>
          ) : null}
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
