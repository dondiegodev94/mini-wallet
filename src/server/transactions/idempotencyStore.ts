import "server-only";
import type { Transaction } from "@/domain/models/transaction";

export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

type CompletedEntry = { fingerprint: string; transaction: Transaction; expiresAt: number };
type InFlightEntry<T> = { fingerprint: string; promise: Promise<T> };

type IdempotencyState = {
  completed: Map<string, CompletedEntry>;
  inFlight: Map<string, InFlightEntry<unknown>>;
};

const globalForIdempotency = globalThis as typeof globalThis & { miniWalletIdempotency?: IdempotencyState };

function getState(): IdempotencyState {
  globalForIdempotency.miniWalletIdempotency ??= { completed: new Map(), inFlight: new Map() };
  return globalForIdempotency.miniWalletIdempotency;
}

// La clave es única por usuario: dos usuarios con la misma clave no se afectan.
function scoped(userId: string, key: string): string {
  return `${userId}:${key}`;
}

export const idempotencyStore = {
  findCompleted(userId: string, key: string, now = Date.now()): CompletedEntry | undefined {
    const entry = getState().completed.get(scoped(userId, key));
    if (!entry) return undefined;
    if (entry.expiresAt > now) return entry;
    getState().completed.delete(scoped(userId, key));
    return undefined;
  },

  saveCompleted(userId: string, key: string, fingerprint: string, transaction: Transaction, now = Date.now()): void {
    getState().completed.set(scoped(userId, key), {
      fingerprint,
      transaction,
      expiresAt: now + IDEMPOTENCY_TTL_MS,
    });
  },

  findInFlight<T>(userId: string, key: string): InFlightEntry<T> | undefined {
    return getState().inFlight.get(scoped(userId, key)) as InFlightEntry<T> | undefined;
  },

  setInFlight<T>(userId: string, key: string, entry: InFlightEntry<T>): void {
    getState().inFlight.set(scoped(userId, key), entry);
  },

  clearInFlight(userId: string, key: string): void {
    getState().inFlight.delete(scoped(userId, key));
  },

  reset(): void {
    globalForIdempotency.miniWalletIdempotency = { completed: new Map(), inFlight: new Map() };
  },
};
