import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetTransferDraft, useTransferStore } from "@/application/store/transferStore";
import { submitTransfer } from "@/application/transfer/submitTransfer";
import { TRANSFER_STATUS_ROUTE } from "./useTransferStatus";

export const TRANSFER_ROUTE = "/transfer";
const HOME_ROUTE = "/";

export function useTransferReview() {
  const router = useRouter();
  const review = useTransferStore((state) => state.review);
  const isSubmitted = useTransferStore((state) => state.submission !== null);

  useEffect(() => {
    // Sin borrador (recarga o acceso por URL) no hay nada que revisar. Con un envío, la navegación
    // al estado ya está en curso: un fallo inmediato (conexión cortada) no debe desviarla a /transfer.
    if (!review && !isSubmitted) router.replace(TRANSFER_ROUTE);
  }, [review, isSubmitted, router]);

  const confirm = useCallback(() => {
    // El resumen se consume al primer clic: un segundo clic ya no encuentra qué enviar.
    const current = useTransferStore.getState().review;
    if (!current) return;

    void submitTransfer({
      idempotencyKey: current.idempotencyKey,
      contact: current.contact,
      amountCents: current.amountCents,
      concept: current.concept,
    });
    // `replace` sustituye al resumen en el historial: "Atrás" no vuelve a "Confirmar".
    router.replace(TRANSFER_STATUS_ROUTE);
  }, [router]);

  const edit = useCallback(() => router.push(TRANSFER_ROUTE), [router]);

  const cancel = useCallback(() => {
    resetTransferDraft();
    router.push(HOME_ROUTE);
  }, [router]);

  return { review, isSubmitted, confirm, edit, cancel };
}
