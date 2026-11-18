import { useId, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Input({
  label,
  hint,
  error,
  id,
  className,
  "aria-describedby": describedByProp,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [hintId, errorId, describedByProp].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-11 w-full rounded-control border border-line-control bg-canvas px-3.5 text-sm text-ink placeholder:text-ink-subtle hover:border-accent disabled:cursor-not-allowed disabled:opacity-55",
          error && "border-danger",
          className,
        )}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm leading-6 text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm leading-6 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
