import type { SessionUser } from "./user";

export type MovementType = "DEBIT" | "CREDIT";

export type Movement = {
  id: string;
  type: MovementType;
  amountCents: number;
  counterparty: string;
  concept: string;
  occurredAt: string;
};

export type WalletSummary = {
  user: SessionUser;
  balanceCents: number;
  movements: Movement[];
};
