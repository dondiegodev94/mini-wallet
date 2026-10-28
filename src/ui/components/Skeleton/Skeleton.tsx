import type { ComponentProps } from "react";
import { cn } from "@/ui/utils/cn";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-border/60", className)} {...props} />
  );
}
