import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiErrorBody, ApiErrorCode } from "@/domain/contracts/api";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message, fieldErrors } }, { status });
}

export function validationError(error: z.ZodError) {
  const { fieldErrors } = z.flattenError(error);
  const message = error.issues[0]?.message ?? "Solicitud inválida.";
  return apiError(400, "VALIDATION_ERROR", message, fieldErrors as Record<string, string[]>);
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
