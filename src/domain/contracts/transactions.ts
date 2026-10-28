import { z } from "zod";
import { ACCOUNT_TYPES, BANKS } from "@/domain/models/contact";
import type { Transaction } from "@/domain/models/transaction";
import { CONCEPT_MAX_LENGTH, TRANSFER_MESSAGES, normalizeConcept } from "@/domain/rules/transfer";

export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
export const IDEMPOTENT_REPLAYED_HEADER = "Idempotent-Replayed";

export const idempotencyKeySchema = z.uuid();

// Mismas reglas y mensajes que el formulario (SPEC-TX), revalidadas en el servidor.
export const transferRequestSchema = z.strictObject({
  contactId: z
    .string({ error: TRANSFER_MESSAGES.recipientRequired })
    .trim()
    .min(1, TRANSFER_MESSAGES.recipientRequired),
  amountCents: z
    .number({ error: TRANSFER_MESSAGES.amountRequired })
    .int(TRANSFER_MESSAGES.amountPositive)
    .positive(TRANSFER_MESSAGES.amountPositive),
  concept: z
    .string()
    .optional()
    .transform((concept) => normalizeConcept(concept ?? ""))
    .pipe(z.string().max(CONCEPT_MAX_LENGTH, TRANSFER_MESSAGES.conceptTooLong)),
});

export type TransferRequestInput = z.input<typeof transferRequestSchema>;
export type TransferRequest = z.output<typeof transferRequestSchema>;

export const transactionSchema: z.ZodType<Transaction> = z.object({
  id: z.string(),
  reference: z.string(),
  amountCents: z.number().int().positive(),
  concept: z.string(),
  createdAt: z.iso.datetime(),
  recipient: z.object({
    name: z.string(),
    bank: z.enum(BANKS),
    accountType: z.enum(ACCOUNT_TYPES),
    maskedAccount: z.string(),
  }),
  balanceAfterCents: z.number().int().nonnegative(),
});

export const transactionCreatedResponseSchema = z.object({ transaction: transactionSchema });

export type TransactionCreatedResponse = z.infer<typeof transactionCreatedResponseSchema>;
