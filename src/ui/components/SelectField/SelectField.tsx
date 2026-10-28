"use client";

import { cva } from "class-variance-authority";
import { useCallback, useId, type ChangeEvent, type ComponentProps } from "react";
import { cn } from "@/ui/utils/cn";

const selectVariants = cva(
  "h-12 w-full appearance-none rounded-lg border bg-surface pr-10 pl-4 text-base text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-70",
  {
    variants: {
      invalid: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "border-border focus-visible:border-primary focus-visible:ring-primary",
      },
    },
    defaultVariants: { invalid: false },
  },
);

type SelectFieldProps = Omit<ComponentProps<"select">, "value" | "onChange" | "children"> & {
  label: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  onValueChange: (value: string) => void;
  error?: string | null;
};

export function SelectField({
  label,
  value,
  options,
  placeholder,
  onValueChange,
  error,
  id,
  className,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => onValueChange(event.target.value),
    [onValueChange],
  );

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={selectId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={handleChange}
          className={selectVariants({ invalid: Boolean(error) })}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...selectProps}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-2.5 -translate-y-3/4 rotate-45 border-r-2 border-b-2 border-muted-foreground"
        />
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
