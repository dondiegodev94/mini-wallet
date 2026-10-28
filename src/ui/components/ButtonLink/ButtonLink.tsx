import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { buttonVariants } from "@/ui/components/Button/Button";
import { cn } from "@/ui/utils/cn";

export type ButtonLinkProps = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

export function ButtonLink({ className, variant, size, fullWidth, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props} />;
}
