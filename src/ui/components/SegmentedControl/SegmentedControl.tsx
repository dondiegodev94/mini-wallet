"use client";

import { useCallback, type ChangeEvent } from "react";
import { cn } from "@/ui/utils/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  legend: string;
  name: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

export function SegmentedControl<T extends string>({
  legend,
  name,
  options,
  value,
  onValueChange,
  disabled = false,
  className,
}: SegmentedControlProps<T>) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const option = options.find((candidate) => candidate.value === event.target.value);
      if (option) onValueChange(option.value);
    },
    [onValueChange, options],
  );

  return (
    <fieldset className={cn("flex flex-col gap-1.5", className)} disabled={disabled}>
      <legend className="mb-1.5 text-sm font-medium text-foreground">{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border border-border bg-muted p-1">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="flex h-10 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors peer-checked:bg-surface peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-disabled:cursor-not-allowed">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
