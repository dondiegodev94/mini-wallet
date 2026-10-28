import { z } from "zod";
import type { WalletSummary } from "@/domain/models/wallet";

const centsSchema = z.number().int();

export const movementSchema = z.object({
  id: z.string(),
  type: z.enum(["DEBIT", "CREDIT"]),
  amountCents: centsSchema.positive(),
  counterparty: z.string(),
  concept: z.string(),
  occurredAt: z.iso.datetime(),
});

export const walletSummarySchema: z.ZodType<WalletSummary> = z.object({
  user: z.object({ id: z.string(), name: z.string() }),
  balanceCents: centsSchema.nonnegative(),
  movements: z.array(movementSchema),
});
