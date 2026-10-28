"use client";

import { useTransferReview } from "@/application/hooks/useTransferReview";
import { Button } from "@/ui/components/Button/Button";
import { TransferProcessing } from "@/ui/features/transfer/TransferProcessing";
import { TransferSummary } from "@/ui/features/transfer/TransferSummary";

export function ReviewScreen() {
  const { review, isSubmitted, confirm, edit, cancel } = useTransferReview();
  // Al confirmar, el resumen se consume y se muestra el procesamiento mientras navega al estado.
  if (!review) return isSubmitted ? <TransferProcessing /> : null;

  return (
    <TransferSummary
      amountCents={review.amountCents}
      contact={review.contact}
      concept={review.concept}
      balanceCents={review.balanceCents}
      actions={
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth onClick={confirm}>
            Confirmar transferencia
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={edit}>
            Editar
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={cancel}>
            Cancelar
          </Button>
        </div>
      }
    />
  );
}
