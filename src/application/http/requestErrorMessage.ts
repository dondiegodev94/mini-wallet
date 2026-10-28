import type { RequestFailure } from "./requestJson";

export const REQUEST_ERROR_MESSAGES = {
  timeout: "La solicitud tardó demasiado. Intenta de nuevo.",
  network: "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
  unexpected: "Ocurrió un error inesperado. Intenta de nuevo.",
} as const;

export function requestErrorMessage(failure: RequestFailure): string {
  switch (failure.kind) {
    case "http":
      return failure.error?.message ?? REQUEST_ERROR_MESSAGES.unexpected;
    case "timeout":
      return REQUEST_ERROR_MESSAGES.timeout;
    case "network":
      return REQUEST_ERROR_MESSAGES.network;
    case "unexpected-response":
      return REQUEST_ERROR_MESSAGES.unexpected;
  }
}
