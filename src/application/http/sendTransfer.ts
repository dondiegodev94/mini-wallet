import { TRANSFER_TIMEOUT_MS } from "@/application/config";
import {
  IDEMPOTENCY_KEY_HEADER,
  transactionCreatedResponseSchema,
  type TransactionCreatedResponse,
} from "@/domain/contracts/transactions";
import type { Contact } from "@/domain/models/contact";
import type { TransferOutcome } from "@/domain/models/transaction";
import { requestJson, type RequestResult } from "./requestJson";

export const TRANSACTIONS_ENDPOINT = "/api/transactions";

export type PendingTransfer = {
  idempotencyKey: string;
  contact: Contact;
  amountCents: number;
  concept: string;
};

export type SendTransferResult = TransferOutcome | { status: "SESSION_EXPIRED" };

export function toTransferOutcome(result: RequestResult<TransactionCreatedResponse>): SendTransferResult {
  if (result.ok) return { status: "SUCCESS", transaction: result.data.transaction };

  switch (result.kind) {
    case "network":
      return { status: "NETWORK_ERROR" };
    case "timeout":
      return { status: "TIMEOUT" };
    case "unexpected-response":
      return { status: "UNKNOWN_ERROR" };
    case "http":
      if (result.status === 401) return { status: "SESSION_EXPIRED" };
      if (result.status === 503) return { status: "NETWORK_ERROR" };
      if (result.error?.code === "INSUFFICIENT_FUNDS") return { status: "INSUFFICIENT_FUNDS" };
      return { status: "UNKNOWN_ERROR" };
  }
}

export async function sendTransfer(pending: PendingTransfer): Promise<SendTransferResult> {
  const result = await requestJson(TRANSACTIONS_ENDPOINT, {
    method: "POST",
    schema: transactionCreatedResponseSchema,
    headers: { [IDEMPOTENCY_KEY_HEADER]: pending.idempotencyKey },
    body: {
      contactId: pending.contact.id,
      amountCents: pending.amountCents,
      concept: pending.concept,
    },
    timeoutMs: TRANSFER_TIMEOUT_MS,
  });
  return toTransferOutcome(result);
}
