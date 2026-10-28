import "server-only";
import { getServerEnv } from "@/server/config/env";

export const MOCK_SCENARIO_HEADER = "x-mock-scenario";

const MOCK_SCENARIOS = ["WALLET_UNAVAILABLE"] as const;

export type MockScenario = (typeof MOCK_SCENARIOS)[number];

export function readMockScenario(headers: Pick<Headers, "get">): MockScenario | null {
  if (!getServerEnv().ENABLE_TEST_SCENARIOS) return null;
  const requested = headers.get(MOCK_SCENARIO_HEADER);
  return MOCK_SCENARIOS.find((scenario) => scenario === requested) ?? null;
}
