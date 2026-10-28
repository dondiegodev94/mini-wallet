import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loginResponseSchema } from "@/domain/contracts/auth";
import { loginSchema } from "@/domain/schemas/login.schema";
import { requestJson } from "@/application/http/requestJson";
import { requestErrorMessage } from "@/application/http/requestErrorMessage";

export type LoginStatus = "idle" | "submitting" | "success" | "error";

type LoginState = {
  identifier: string;
  status: LoginStatus;
  fieldError: string | null;
  formError: string | null;
};

const INITIAL_STATE: LoginState = {
  identifier: "",
  status: "idle",
  fieldError: null,
  formError: null,
};

export const LOGIN_ENDPOINT = "/api/auth";
export const HOME_ROUTE = "/";

export function useLoginFlow() {
  const router = useRouter();
  const [state, setState] = useState<LoginState>(INITIAL_STATE);
  const inFlight = useRef(false);

  const setIdentifier = useCallback((identifier: string) => {
    setState((previous) => ({ ...previous, identifier, fieldError: null, formError: null }));
  }, []);

  const submit = useCallback(async () => {
    if (inFlight.current) return;

    const parsed = loginSchema.safeParse({ identifier: state.identifier });
    if (!parsed.success) {
      setState((previous) => ({
        ...previous,
        status: "error",
        fieldError: parsed.error.issues[0]?.message ?? null,
        formError: null,
      }));
      return;
    }

    inFlight.current = true;
    setState((previous) => ({ ...previous, status: "submitting", fieldError: null, formError: null }));

    const result = await requestJson(LOGIN_ENDPOINT, {
      method: "POST",
      body: { identifier: state.identifier },
      schema: loginResponseSchema,
    });

    if (result.ok) {
      // Resetear al estado limpio ANTES de navegar: el Router Cache de Next.js guarda el estado del
      // componente al momento de la navegación. Si guardamos INITIAL_STATE, lo restaura limpio.
      inFlight.current = false;
      setState(INITIAL_STATE);
      router.replace(HOME_ROUTE);
      return;
    }

    inFlight.current = false;
    const fieldError =
      result.kind === "http" ? (result.error?.fieldErrors?.identifier?.[0] ?? null) : null;
    setState((previous) => ({
      ...previous,
      status: "error",
      fieldError,
      formError: fieldError ? null : requestErrorMessage(result),
    }));
  }, [router, state.identifier]);

  return {
    identifier: state.identifier,
    status: state.status,
    fieldError: state.fieldError,
    formError: state.formError,
    isSubmitting: state.status === "submitting",
    setIdentifier,
    submit,
  };
}
