import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { TRANSFER_TIMEOUT_MS } from "@/application/config";
import type { TransferRequest } from "@/domain/contracts/transactions";
import type { Transaction, TransferOutcomeStatus } from "@/domain/models/transaction";
import { maskAccount } from "@/domain/rules/account";
import { DEFAULT_CONCEPT, validateTransfer } from "@/domain/rules/transfer";
import { contactRepository } from "@/server/contacts/contactRepository";
import { simulateLatency } from "@/server/mock/latency";
import { walletRepository } from "@/server/wallet/walletRepository";
import { pickScenario } from "./chaosEngine";
import { idempotencyStore } from "./idempotencyStore";

export const TRANSACTION_LATENCY_MS = 1200;
// Siempre más que el límite del cliente, así el escenario TIMEOUT se ve con cualquier configuración.
export const TIMEOUT_RESPONSE_DELAY_MS = TRANSFER_TIMEOUT_MS + 5000;

type FailureKind =
  | "IDEMPOTENCY_KEY_REUSED"
  | "RECIPIENT_NOT_FOUND"
  | "INSUFFICIENT_FUNDS"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export type ProcessTransferResult =
  | { kind: "SUCCESS"; transaction: Transaction; replayed: boolean }
  | { kind: FailureKind };

type Execution = { result: ProcessTransferResult; scenario: TransferOutcomeStatus | null };

type ProcessOptions = {
  scenario: TransferOutcomeStatus | null;
  random?: () => number;
};

const KEY_REUSED: ProcessTransferResult = { kind: "IDEMPOTENCY_KEY_REUSED" };

function fingerprintOf({ contactId, amountCents, concept }: TransferRequest): string {
  return JSON.stringify([contactId, amountCents, concept]);
}

function newReference(): string {
  return `MW${String(randomInt(0, 100_000_000)).padStart(8, "0")}`;
}

async function execute(
  userId: string,
  key: string,
  request: TransferRequest,
  fingerprint: string,
  options: ProcessOptions,
): Promise<Execution> {
  await simulateLatency(TRANSACTION_LATENCY_MS);

  // Desde aquí no hay `await`: revalidación, motor de caos y cargo ocurren como un bloque atómico.
  const contact = contactRepository.findById(userId, request.contactId);
  if (!contact) return { result: { kind: "RECIPIENT_NOT_FOUND" }, scenario: null };

  const balanceCents = walletRepository.getBalance(userId) ?? 0;
  if (validateTransfer(request, balanceCents).amount) {
    return { result: { kind: "INSUFFICIENT_FUNDS" }, scenario: null };
  }

  const scenario = options.scenario ?? pickScenario(options.random);
  if (scenario !== "SUCCESS" && scenario !== "TIMEOUT") return { result: { kind: scenario }, scenario };

  const createdAt = new Date().toISOString();
  const concept = request.concept || DEFAULT_CONCEPT;
  const balanceAfterCents = walletRepository.debit(userId, {
    id: `mov_${randomUUID().slice(0, 8)}`,
    type: "DEBIT",
    amountCents: request.amountCents,
    counterparty: contact.name,
    concept,
    occurredAt: createdAt,
  });
  if (balanceAfterCents === null) return { result: { kind: "INSUFFICIENT_FUNDS" }, scenario: null };

  const transaction: Transaction = {
    id: `tx_${randomUUID().slice(0, 8)}`,
    reference: newReference(),
    amountCents: request.amountCents,
    concept,
    createdAt,
    recipient: {
      name: contact.name,
      bank: contact.bank,
      accountType: contact.accountType,
      maskedAccount: maskAccount(contact.account),
    },
    balanceAfterCents,
  };
  // Se registra antes de responder: un reintento tras el timeout recupera este comprobante sin cobrar otra vez.
  idempotencyStore.saveCompleted(userId, key, fingerprint, transaction);
  return { result: { kind: "SUCCESS", transaction, replayed: false }, scenario };
}

function asReplay(result: ProcessTransferResult): ProcessTransferResult {
  return result.kind === "SUCCESS" ? { ...result, replayed: true } : result;
}

export async function processTransfer(
  userId: string,
  key: string,
  request: TransferRequest,
  options: ProcessOptions,
): Promise<ProcessTransferResult> {
  const fingerprint = fingerprintOf(request);

  const completed = idempotencyStore.findCompleted(userId, key);
  if (completed) {
    return completed.fingerprint === fingerprint
      ? { kind: "SUCCESS", transaction: completed.transaction, replayed: true }
      : KEY_REUSED;
  }

  const inFlight = idempotencyStore.findInFlight<Execution>(userId, key);
  if (inFlight) {
    if (inFlight.fingerprint !== fingerprint) return KEY_REUSED;
    return asReplay((await inFlight.promise).result);
  }

  // Se registra en curso antes del primer `await`: una solicitud concurrente con la misma clave espera a esta.
  const promise = execute(userId, key, request, fingerprint, options);
  idempotencyStore.setInFlight(userId, key, { fingerprint, promise });
  let execution: Execution;
  try {
    execution = await promise;
  } finally {
    idempotencyStore.clearInFlight(userId, key);
  }

  if (execution.scenario === "TIMEOUT") await simulateLatency(TIMEOUT_RESPONSE_DELAY_MS);
  return execution.result;
}
