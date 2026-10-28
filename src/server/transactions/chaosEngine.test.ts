/** @jest-environment node */
import { TRANSFER_OUTCOMES } from "@/domain/models/transaction";
import { CHAOS_WEIGHTS, pickScenario } from "./chaosEngine";

describe("[SPEC-CONF-R09] motor de caos", () => {
  it("[SPEC-CONF-AC13] reparte los escenarios en proporción a sus pesos", () => {
    const samples = 1000;
    const counts = Object.fromEntries(TRANSFER_OUTCOMES.map((status) => [status, 0]));

    for (let index = 0; index < samples; index += 1) {
      counts[pickScenario(() => index / samples)] += 1;
    }

    expect(counts).toEqual({
      SUCCESS: 600,
      NETWORK_ERROR: 100,
      INSUFFICIENT_FUNDS: 100,
      TIMEOUT: 100,
      UNKNOWN_ERROR: 100,
    });
  });

  it("cubre los extremos del rango", () => {
    expect(pickScenario(() => 0)).toBe("SUCCESS");
    expect(pickScenario(() => 0.9999999)).toBe("UNKNOWN_ERROR");
  });

  it("usa los pesos recibidos", () => {
    const onlyTimeouts = { ...CHAOS_WEIGHTS, SUCCESS: 0, NETWORK_ERROR: 0, INSUFFICIENT_FUNDS: 0, UNKNOWN_ERROR: 0 };
    expect(pickScenario(() => 0.5, onlyTimeouts)).toBe("TIMEOUT");
  });

  it("es aleatorio por defecto", () => {
    expect(TRANSFER_OUTCOMES).toContain(pickScenario());
  });
});
