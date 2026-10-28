"use client";

import { useLogout } from "@/application/hooks/useLogout";
import { LogoutControl } from "@/ui/features/layout/LogoutControl";

export function LogoutButton() {
  const { isPending, error, logout } = useLogout();
  return <LogoutControl isPending={isPending} error={error} onLogout={logout} />;
}
