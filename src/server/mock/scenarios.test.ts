/** @jest-environment node */
import { MOCK_SCENARIO_HEADER, readMockScenario } from "./scenarios";

function headersWith(value: string) {
  return new Headers({ [MOCK_SCENARIO_HEADER]: value });
}

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret-with-at-least-32-characters";
});

describe("[SPEC-HOME-R08] escenarios simulados", () => {
  it("con escenarios habilitados respeta un escenario conocido", () => {
    process.env.ENABLE_TEST_SCENARIOS = "true";
    expect(readMockScenario(headersWith("WALLET_UNAVAILABLE"))).toBe("WALLET_UNAVAILABLE");
  });

  it("ignora un escenario desconocido", () => {
    process.env.ENABLE_TEST_SCENARIOS = "true";
    expect(readMockScenario(headersWith("DROP_DATABASE"))).toBeNull();
  });

  it("sin el header no hay escenario", () => {
    process.env.ENABLE_TEST_SCENARIOS = "true";
    expect(readMockScenario(new Headers())).toBeNull();
  });

  it("con escenarios deshabilitados ignora el header", () => {
    process.env.ENABLE_TEST_SCENARIOS = "false";
    expect(readMockScenario(headersWith("WALLET_UNAVAILABLE"))).toBeNull();
  });
});
