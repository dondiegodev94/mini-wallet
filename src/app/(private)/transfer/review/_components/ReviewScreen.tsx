"use client";

import { useTransferReview } from "@/application/hooks/useTransferReview";
import { Button } from "@/ui/components/Button/Button";
import { TransferSummary } from "@/ui/features/transfer/TransferSummary";

export function ReviewScreen() {
  const { review, edit, cancel } = useTransferReview();
  if (!review) return null;

  return (
    <TransferSummary
      amountCents={review.amountCents}
      contact={review.contact}
      concept={review.concept}
      balanceCents={review.balanceCents}
      actions={
        <div className="flex flex-col gap-2">
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
