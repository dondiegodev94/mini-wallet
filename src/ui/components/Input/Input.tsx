import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/ui/utils/cn";

const inputVariants = cva(
  "h-12 w-full rounded-lg border bg-surface px-4 text-base text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 read-only:opacity-70",
  {
    variants: {
      invalid: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "border-border focus-visible:border-primary focus-visible:ring-primary",
      },
    },
    defaultVariants: {
      invalid: false,
    },
  },
);

export type InputProps = ComponentProps<"input"> & {
  invalid?: boolean;
};

export function Input({ className, invalid = false, ...props }: InputProps) {
  return (
    <input
      className={cn(inputVariants({ invalid }), className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
