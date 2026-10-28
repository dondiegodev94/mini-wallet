/** @jest-environment node */
import { MOCK_SCENARIO_HEADER, readMockScenario, readTransferScenario } from "./scenarios";

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

describe("[SPEC-CONF-R10] escenarios de la transferencia", () => {
  it.each(["SUCCESS", "NETWORK_ERROR", "INSUFFICIENT_FUNDS", "TIMEOUT", "UNKNOWN_ERROR"])(
    "con escenarios habilitados respeta %s",
    (scenario) => {
      process.env.ENABLE_TEST_SCENARIOS = "true";
      expect(readTransferScenario(headersWith(scenario))).toBe(scenario);
    },
  );

  it("no mezcla los escenarios del saldo con los de la transferencia", () => {
    process.env.ENABLE_TEST_SCENARIOS = "true";
    expect(readTransferScenario(headersWith("WALLET_UNAVAILABLE"))).toBeNull();
    expect(readMockScenario(headersWith("TIMEOUT"))).toBeNull();
  });

  it("con escenarios deshabilitados ignora el header", () => {
    process.env.ENABLE_TEST_SCENARIOS = "false";
    expect(readTransferScenario(headersWith("TIMEOUT"))).toBeNull();
  });
});
