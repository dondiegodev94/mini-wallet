"use client";

import { cva } from "class-variance-authority";
import {
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/ui/utils/cn";
import { applyMaskedEdit } from "@/ui/utils/maskedInput";

const fieldVariants = cva(
  "flex w-full items-center gap-2 rounded-lg border bg-surface px-4 transition-colors focus-within:ring-2 has-[input:read-only]:opacity-70",
  {
    variants: {
      size: {
        md: "h-12 text-base",
        lg: "h-16 text-3xl font-bold tracking-tight",
      },
      invalid: {
        true: "border-destructive focus-within:ring-destructive",
        false: "border-border focus-within:border-primary focus-within:ring-primary",
      },
    },
    defaultVariants: { size: "md", invalid: false },
  },
);

type NativeInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "size" | "prefix" | "ref" | "inputMode"
>;

export type MaskedFieldProps = NativeInputProps & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  sanitize: (raw: string) => string | null;
  format: (value: string) => string;
  inputMode: "numeric" | "decimal";
  error?: string | null;
  hint?: ReactNode;
  prefix?: string;
  suffix?: string;
  size?: "md" | "lg";
  ref?: Ref<HTMLInputElement | null>;
};

function forceRenderReducer(count: number): number {
  return count + 1;
}

export function MaskedField({
  label,
  value,
  onValueChange,
  sanitize,
  format,
  inputMode,
  error,
  hint,
  prefix,
  suffix,
  size,
  id,
  className,
  ref,
  ...inputProps
}: MaskedFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);
  const [, forceRender] = useReducer(forceRenderReducer, 0);
  const display = format(value);

  useImperativeHandle<HTMLInputElement | null, HTMLInputElement | null>(ref, () => inputRef.current, []);

  // Se reubica el cursor después de que React escribe el valor formateado en el DOM.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (pendingCaret.current === null || !input || document.activeElement !== input) return;
    input.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  });

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value: raw, selectionStart } = event.target;
      const inputType = (event.nativeEvent as InputEvent).inputType ?? "insertText";
      const change = applyMaskedEdit(
        { raw, caret: selectionStart ?? raw.length, inputType },
        value,
        sanitize,
        format,
      );

      pendingCaret.current = change.caret;
      if (change.value !== null && change.value !== value) onValueChange(change.value);
      forceRender();
    },
    [format, onValueChange, sanitize, value],
  );

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className={fieldVariants({ size, invalid: Boolean(error) })}>
        {prefix ? (
          <span aria-hidden="true" className="text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          className="h-full w-full min-w-0 bg-transparent text-foreground tabular-nums placeholder:text-muted-foreground focus-visible:outline-none"
          value={display}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...inputProps}
        />
        {suffix ? (
          <span aria-hidden="true" className="shrink-0 text-base font-medium text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
