import "server-only";
import { TRANSFER_OUTCOMES, type TransferOutcomeStatus } from "@/domain/models/transaction";

export type ChaosWeights = Readonly<Record<TransferOutcomeStatus, number>>;

export const CHAOS_WEIGHTS: ChaosWeights = {
  SUCCESS: 60,
  NETWORK_ERROR: 10,
  INSUFFICIENT_FUNDS: 10,
  TIMEOUT: 10,
  UNKNOWN_ERROR: 10,
};

export function pickScenario(
  random: () => number = Math.random,
  weights: ChaosWeights = CHAOS_WEIGHTS,
): TransferOutcomeStatus {
  const total = TRANSFER_OUTCOMES.reduce((sum, status) => sum + weights[status], 0);
  let threshold = random() * total;
  for (const status of TRANSFER_OUTCOMES) {
    threshold -= weights[status];
    if (threshold < 0) return status;
  }
  return "SUCCESS";
}
