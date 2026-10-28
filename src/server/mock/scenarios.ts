import "server-only";
import { TRANSFER_OUTCOMES, type TransferOutcomeStatus } from "@/domain/models/transaction";
import { getServerEnv } from "@/server/config/env";

export const MOCK_SCENARIO_HEADER = "x-mock-scenario";

const WALLET_SCENARIOS = ["WALLET_UNAVAILABLE"] as const;

export type MockScenario = (typeof WALLET_SCENARIOS)[number];

function readScenario<T extends string>(headers: Pick<Headers, "get">, allowed: readonly T[]): T | null {
  if (!getServerEnv().ENABLE_TEST_SCENARIOS) return null;
  const requested = headers.get(MOCK_SCENARIO_HEADER);
  return allowed.find((scenario) => scenario === requested) ?? null;
}

export function readMockScenario(headers: Pick<Headers, "get">): MockScenario | null {
  return readScenario(headers, WALLET_SCENARIOS);
}

export function readTransferScenario(headers: Pick<Headers, "get">): TransferOutcomeStatus | null {
  return readScenario(headers, TRANSFER_OUTCOMES);
}
