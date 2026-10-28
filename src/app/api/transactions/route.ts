import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/domain/contracts/api";
import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENT_REPLAYED_HEADER,
  idempotencyKeySchema,
  transferRequestSchema,
  type TransactionCreatedResponse,
} from "@/domain/contracts/transactions";
import { getCurrentSession } from "@/server/auth/currentSession";
import { apiError, readJsonBody, validationError } from "@/server/http/responses";
import { readTransferScenario } from "@/server/mock/scenarios";
import { processTransfer, type ProcessTransferResult } from "@/server/transactions/transactionService";

type FailureKind = Exclude<ProcessTransferResult["kind"], "SUCCESS">;

const FAILURES: Record<FailureKind, { status: number; code: ApiErrorCode; message: string }> = {
  IDEMPOTENCY_KEY_REUSED: {
    status: 422,
    code: "IDEMPOTENCY_KEY_REUSED",
    message: "La clave de idempotencia ya se usó con otra transferencia.",
  },
  RECIPIENT_NOT_FOUND: {
    status: 422,
    code: "RECIPIENT_NOT_FOUND",
    message: "El destinatario no está entre tus contactos.",
  },
  INSUFFICIENT_FUNDS: {
    status: 422,
    code: "INSUFFICIENT_FUNDS",
    message: "Tu saldo no alcanza para esta transferencia.",
  },
  NETWORK_ERROR: {
    status: 503,
    code: "SERVICE_UNAVAILABLE",
    message: "No pudimos conectar con el procesador de pagos. Intenta de nuevo.",
  },
  UNKNOWN_ERROR: {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Ocurrió un error inesperado al procesar la transferencia.",
  },
};

function toResponse(result: ProcessTransferResult) {
  if (result.kind === "SUCCESS") {
    return NextResponse.json<TransactionCreatedResponse>(
      { transaction: result.transaction },
      {
        status: 201,
        headers: result.replayed ? { [IDEMPOTENT_REPLAYED_HEADER]: "true" } : undefined,
      },
    );
  }
  const { status, code, message } = FAILURES[result.kind];
  return apiError(status, code, message);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return apiError(401, "UNAUTHORIZED", "Tu sesión expiró. Inicia sesión de nuevo.");

  const key = idempotencyKeySchema.safeParse(request.headers.get(IDEMPOTENCY_KEY_HEADER));
  if (!key.success) {
    return apiError(400, "IDEMPOTENCY_KEY_INVALID", "Falta el encabezado Idempotency-Key o no es un UUID.");
  }

  const body = transferRequestSchema.safeParse(await readJsonBody(request));
  if (!body.success) return validationError(body.error);

  const result = await processTransfer(session.userId, key.data, body.data, {
    scenario: readTransferScenario(request.headers),
  });
  return toResponse(result);
}
