import { useId } from "react";
import { Input, type InputProps } from "@/ui/components/Input/Input";
import { cn } from "@/ui/utils/cn";

export type TextFieldProps = Omit<InputProps, "invalid"> & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, id, className, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        id={inputId}
        invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
