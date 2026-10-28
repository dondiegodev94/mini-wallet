import type { ReactNode } from "react";
import { Card } from "@/ui/components/Card/Card";
import { formatMoney } from "@/domain/rules/money";

type BalanceCardProps = {
  userName: string;
  balanceCents: number;
  action?: ReactNode;
};

export function BalanceCard({ userName, balanceCents, action }: BalanceCardProps) {
  const firstName = userName.split(" ")[0] ?? userName;

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-bold text-foreground">Hola, {firstName}</h1>
        <dl className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">Saldo disponible</dt>
          <dd className="text-3xl font-bold tracking-tight text-foreground tabular-nums sm:text-4xl">
            {formatMoney(balanceCents)}
          </dd>
        </dl>
      </div>
      {action}
    </Card>
  );
}
