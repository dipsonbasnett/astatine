import { useId, type SelectHTMLAttributes } from "react";

import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Select({
  label,
  hint,
  error,
  id,
  className,
  children,
  "aria-describedby": describedByProp,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy =
    [hintId, errorId, describedByProp].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-11 w-full appearance-none rounded-control border border-line-control bg-canvas px-3.5 pr-10 text-sm text-ink hover:border-accent disabled:cursor-not-allowed disabled:opacity-55",
            error && "border-danger",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-subtle" />
      </div>
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
