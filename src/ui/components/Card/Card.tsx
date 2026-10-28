import type { ComponentProps } from "react";
import { cn } from "@/ui/utils/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-surface p-6 shadow-sm", className)}
      {...props}
    />
  );
}
