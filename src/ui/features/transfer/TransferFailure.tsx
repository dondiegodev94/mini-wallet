import type { ReactNode } from "react";
import type { TransferOutcomeStatus } from "@/domain/models/transaction";
import { Card } from "@/ui/components/Card/Card";
import { focusOnMount } from "@/ui/utils/focusOnMount";

export type TransferFailureStatus = Exclude<TransferOutcomeStatus, "SUCCESS">;

export const TRANSFER_FAILURE_COPY: Record<TransferFailureStatus, { title: string; description: string }> = {
  NETWORK_ERROR: {
    title: "No pudimos conectar con el servidor",
    description: "Revisa tu conexión e inténtalo de nuevo; no se te cobrará dos veces.",
  },
  TIMEOUT: {
    title: "Tu transferencia está tardando más de lo normal",
    description:
      "Aún no sabemos si se completó. Reintentar es seguro: si ya se procesó verás el comprobante y no se te cobrará dos veces.",
  },
  INSUFFICIENT_FUNDS: {
    title: "Fondos insuficientes",
    description:
      "Tu saldo cambió desde que iniciaste la transferencia y ya no alcanza para enviarla. No se realizó ningún cargo.",
  },
  UNKNOWN_ERROR: {
    title: "Algo salió mal",
    description:
      "No pudimos completar tu transferencia. Revisa tus movimientos en el inicio antes de intentarlo de nuevo.",
  },
};

type TransferFailureProps = {
  status: TransferFailureStatus;
  actions: ReactNode;
};

export function TransferFailure({ status, actions }: TransferFailureProps) {
  const { title, description } = TRANSFER_FAILURE_COPY[status];

  return (
    <div className="flex flex-col gap-6">
      <Card role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-2xl font-bold text-destructive"
        >
          !
        </span>
        <h1 ref={focusOnMount} tabIndex={-1} className="text-xl font-bold text-foreground focus:outline-none">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </Card>
      {actions}
    </div>
  );
}
