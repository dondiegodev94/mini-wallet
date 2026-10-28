import { z } from "zod";

export const API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_CREDENTIALS",
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
