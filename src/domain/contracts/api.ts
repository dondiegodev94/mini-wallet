import { z } from "zod";

export const API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_CREDENTIALS",
  "UNAUTHORIZED",
  "CONTACT_ALREADY_EXISTS",
  "IDEMPOTENCY_KEY_INVALID",
  "IDEMPOTENCY_KEY_REUSED",
  "RECIPIENT_NOT_FOUND",
  "INSUFFICIENT_FUNDS",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.enum(API_ERROR_CODES),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
export type ApiError = ApiErrorBody["error"];
