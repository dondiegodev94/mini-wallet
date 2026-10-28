import type { ReactNode } from "react";

type AppShellProps = {
  actions: ReactNode;
  children: ReactNode;
};

export function AppShell({ actions, children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <p className="font-bold tracking-tight text-foreground">Mini Wallet</p>
          {actions}
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
