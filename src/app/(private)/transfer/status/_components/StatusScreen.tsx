"use client";

import { useTransferStatus } from "@/application/hooks/useTransferStatus";
import { Button } from "@/ui/components/Button/Button";
import { TransferFailure } from "@/ui/features/transfer/TransferFailure";
import { TransferProcessing } from "@/ui/features/transfer/TransferProcessing";
import { TransferReceipt } from "@/ui/features/transfer/TransferReceipt";

export function StatusScreen() {
  const { submission, retry, goHome } = useTransferStatus();
  if (!submission) return null;
  if (submission.phase === "processing") return <TransferProcessing />;

  const { outcome, pending } = submission;

  if (outcome.status === "SUCCESS") {
    return (
      <TransferReceipt
        transaction={outcome.transaction}
        actions={
          <Button size="lg" fullWidth onClick={goHome}>
            Volver al inicio
          </Button>
        }
      />
    );
  }

  return (
    <TransferFailure
      status={outcome.status}
      actions={
        <div className="flex flex-col gap-2">
          {pending ? (
            <Button size="lg" fullWidth onClick={retry}>
              Reintentar
            </Button>
          ) : null}
          <Button variant={pending ? "secondary" : "primary"} size="lg" fullWidth onClick={goHome}>
            Volver al inicio
          </Button>
        </div>
      }
    />
  );
}
