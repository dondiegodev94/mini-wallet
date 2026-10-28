import type { ReactNode } from "react";
import { Card } from "@/ui/components/Card/Card";

type ErrorStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <Card role="alert" className="flex flex-col items-center gap-4 text-center">
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </Card>
  );
}
