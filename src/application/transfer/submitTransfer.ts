import { LOGIN_ROUTE } from "@/application/hooks/useLogout";
import { sendTransfer, type PendingTransfer } from "@/application/http/sendTransfer";
import { hardNavigate } from "@/application/navigation/hardNavigate";
import { useTransferStore } from "@/application/store/transferStore";

// Vive fuera de React: el envío termina aunque el usuario cambie de pantalla mientras se procesa.
export async function submitTransfer(pending: PendingTransfer): Promise<void> {
  useTransferStore.getState().beginSubmission(pending);
  const result = await sendTransfer(pending);

  if (result.status === "SESSION_EXPIRED") {
    useTransferStore.getState().reset();
    hardNavigate(LOGIN_ROUTE);
    return;
  }
  useTransferStore.getState().completeSubmission(pending.idempotencyKey, result);
}
