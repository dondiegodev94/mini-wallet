import { useId } from "react";
import type { Movement } from "@/domain/models/wallet";
import { Card } from "@/ui/components/Card/Card";
import { EmptyState } from "@/ui/components/EmptyState/EmptyState";
import { cn } from "@/ui/utils/cn";
import { formatDateTime, formatMovementAmount } from "@/ui/utils/format";

const TYPE_LABEL = { DEBIT: "Cargo", CREDIT: "Abono" } as const;

function MovementItem({ movement }: { movement: Movement }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{movement.counterparty}</span>
        <span className="truncate text-sm text-muted-foreground">
          {movement.concept} · <time dateTime={movement.occurredAt}>{formatDateTime(movement.occurredAt)}</time>
        </span>
      </div>
      <span
        className={cn(
          "shrink-0 font-semibold tabular-nums",
          movement.type === "CREDIT" ? "text-success" : "text-foreground",
        )}
      >
        <span className="sr-only">{TYPE_LABEL[movement.type]}: </span>
        {formatMovementAmount(movement.amountCents, movement.type)}
      </span>
    </li>
  );
}

export function MovementList({ movements }: { movements: Movement[] }) {
  const titleId = useId();

  return (
    <Card className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-foreground" id={titleId}>
        Movimientos recientes
      </h2>
      {movements.length === 0 ? (
        <EmptyState
          title="Aún no tienes movimientos"
          description="Cuando envíes o recibas dinero, aparecerá aquí."
        />
      ) : (
        <ul aria-labelledby={titleId} className="divide-y divide-border">
          {movements.map((movement) => (
            <MovementItem key={movement.id} movement={movement} />
          ))}
        </ul>
      )}
    </Card>
  );
}
