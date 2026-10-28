import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { requestJson } from "@/application/http/requestJson";
import { requestErrorMessage } from "@/application/http/requestErrorMessage";

export const LOGOUT_ENDPOINT = "/api/auth";
export const LOGIN_ROUTE = "/login";

const emptyResponseSchema = z.null();

export function useLogout() {
  const router = useRouter();
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
      router.replace(LOGIN_ROUTE);
      router.refresh();
      return;
    }

    inFlight.current = false;
    setIsPending(false);
    setError(requestErrorMessage(result));
  }, [router]);

  return { isPending, error, logout };
}
