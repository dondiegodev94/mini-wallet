import type { ReactNode } from "react";
import type { WalletSummary } from "@/domain/models/wallet";
import { BalanceCard } from "./BalanceCard";
import { MovementList } from "./MovementList";

type WalletDashboardProps = {
  summary: WalletSummary;
  transferAction: ReactNode;
};

export function WalletDashboard({ summary, transferAction }: WalletDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <BalanceCard
        userName={summary.user.name}
        balanceCents={summary.balanceCents}
        action={transferAction}
      />
      <MovementList movements={summary.movements} />
    </div>
  );
}
