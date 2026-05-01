"use client";

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
}: FieldWithTooltipProps) {
  const errorId = errorText ? `${id}-error` : undefined;

  return (
    <div>
      <label className="mb-[10px] block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block">
              <Input
                aria-describedby={errorId}
                aria-invalid={Boolean(errorText)}
                autoComplete={autoComplete}
                defaultValue={defaultValue}
                id={id}
                maxLength={maxLength}
                name={name}
                placeholder={placeholder}
                type={type}
                value={value}
                onChange={onChange}
              />
            </span>
          </TooltipTrigger>
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
