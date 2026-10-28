import type { ReactNode } from "react";
import { AppShell } from "@/ui/features/layout/AppShell";
import { LogoutButton } from "./_components/LogoutButton";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return <AppShell actions={<LogoutButton />}>{children}</AppShell>;
}
