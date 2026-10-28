import type { AccountType, Bank } from "./contact";

export const TRANSFER_OUTCOMES = [
  "SUCCESS",
  "NETWORK_ERROR",
  "INSUFFICIENT_FUNDS",
  "TIMEOUT",
  "UNKNOWN_ERROR",
] as const;

export type TransferOutcomeStatus = (typeof TRANSFER_OUTCOMES)[number];

export type Transaction = {
  id: string;
  reference: string;
  amountCents: number;
  concept: string;
  createdAt: string;
  recipient: {
    name: string;
    bank: Bank;
    accountType: AccountType;
    maskedAccount: string;
  };
  balanceAfterCents: number;
};

// El comprobante solo existe en el éxito; los fallos no llevan datos.
export type TransferOutcome =
  | { status: "SUCCESS"; transaction: Transaction }
  | { status: Exclude<TransferOutcomeStatus, "SUCCESS"> };

const RETRYABLE_OUTCOMES: readonly TransferOutcomeStatus[] = ["NETWORK_ERROR", "TIMEOUT"];

export function isRetryableOutcome(status: TransferOutcomeStatus): boolean {
  return RETRYABLE_OUTCOMES.includes(status);
}
