import "server-only";
import type { WalletSummary } from "@/domain/models/wallet";
import { selectRecentMovements } from "@/domain/rules/movements";
import { simulateLatency } from "@/server/mock/latency";
import type { MockScenario } from "@/server/mock/scenarios";
import { userRepository } from "@/server/users/userRepository";
import { walletRepository } from "./walletRepository";

export const WALLET_LATENCY_MS = 700;

export class WalletUnavailableError extends Error {
  constructor() {
    super("El servicio de saldo no está disponible.");
    this.name = "WalletUnavailableError";
  }
}

export async function getWalletSummary(
  userId: string,
  options: { scenario: MockScenario | null },
): Promise<WalletSummary | null> {
  await simulateLatency(WALLET_LATENCY_MS);

  if (options.scenario === "WALLET_UNAVAILABLE") {
    throw new WalletUnavailableError();
  }

  const [user, account] = await Promise.all([
    userRepository.findById(userId),
    walletRepository.findByUserId(userId),
  ]);
  if (!user || !account) return null;

  return {
    user: { id: user.id, name: user.name },
    balanceCents: account.balanceCents,
    movements: selectRecentMovements(account.movements),
  };
}
