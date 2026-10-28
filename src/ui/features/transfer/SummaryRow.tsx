import type { ReactNode } from "react";

type SummaryRowProps = {
  term: string;
  children: ReactNode;
};

export function SummaryRow({ term, children }: SummaryRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="min-w-0 text-right font-medium break-words text-foreground">{children}</dd>
    </div>
  );
}
