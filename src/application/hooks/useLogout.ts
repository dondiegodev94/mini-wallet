import { useCallback, useRef, useState } from "react";
import { z } from "zod";
import { requestJson } from "@/application/http/requestJson";
import { requestErrorMessage } from "@/application/http/requestErrorMessage";
import { hardNavigate } from "@/application/navigation/hardNavigate";
import { resetTransferDraft } from "@/application/store/transferStore";

export const LOGOUT_ENDPOINT = "/api/auth";
export const LOGIN_ROUTE = "/login";

const emptyResponseSchema = z.null();

export function useLogout() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const logout = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsPending(true);
    setError(null);

    const result = await requestJson(LOGOUT_ENDPOINT, {
      method: "DELETE",
      schema: emptyResponseSchema,
    });

    if (result.ok) {
      inFlight.current = false;
      setIsPending(false);
      resetTransferDraft();
      // Una navegación interna conservaría el estado de las rutas visitadas y lo vería el siguiente usuario.
      hardNavigate(LOGIN_ROUTE);
      return;
    }

    inFlight.current = false;
    setIsPending(false);
    setError(requestErrorMessage(result));
  }, []);

  return { isPending, error, logout };
}
