import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetTransferDraft, useTransferStore } from "@/application/store/transferStore";
import { submitTransfer } from "@/application/transfer/submitTransfer";

export const TRANSFER_STATUS_ROUTE = "/transfer/status";
const HOME_ROUTE = "/";

export function useTransferStatus() {
  const router = useRouter();
  const submission = useTransferStore((state) => state.submission);

  useEffect(() => {
    // Sin un envío en memoria (recarga o URL directa) no hay estado que mostrar.
    if (!submission) router.replace(HOME_ROUTE);
  }, [submission, router]);

  const retry = useCallback(() => {
    const current = useTransferStore.getState().submission;
    if (current?.phase !== "done" || !current.pending) return;
    // Misma solicitud y misma Idempotency-Key: si el cargo ya se aplicó, el servidor devuelve el comprobante original.
    void submitTransfer(current.pending);
  }, []);

  const goHome = useCallback(() => {
    resetTransferDraft();
    router.replace(HOME_ROUTE);
  }, [router]);

  return { submission, retry, goHome };
}
