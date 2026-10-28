import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetTransferDraft, useTransferStore } from "@/application/store/transferStore";

export const TRANSFER_ROUTE = "/transfer";
const HOME_ROUTE = "/";

export function useTransferReview() {
  const router = useRouter();
  const review = useTransferStore((state) => state.review);

  useEffect(() => {
    // Sin borrador (recarga o acceso por URL) no hay nada que revisar.
    if (!review) router.replace(TRANSFER_ROUTE);
  }, [review, router]);

  const edit = useCallback(() => router.push(TRANSFER_ROUTE), [router]);

  const cancel = useCallback(() => {
    resetTransferDraft();
    router.push(HOME_ROUTE);
  }, [router]);

  return { review, edit, cancel };
}
