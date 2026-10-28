import type { ReactNode } from "react";
import { Card } from "@/ui/components/Card/Card";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <header className="mb-6 flex flex-col gap-1">
          <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Mini Wallet
          </p>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>
        {children}
      </Card>
    </main>
  );
}
