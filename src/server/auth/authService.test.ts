/** @jest-environment node */
import { SIMULATED_ERROR_EMAIL, authenticate } from "./authService";

const enabled = { simulateErrors: true };
const disabled = { simulateErrors: false };

describe("authenticate", () => {
  it("encuentra al usuario por email", async () => {
    const result = await authenticate({ kind: "email", value: "ana@miniwallet.dev" }, disabled);
    expect(result).toMatchObject({ ok: true, user: { id: "usr_ana" } });
  });

  it("encuentra al usuario por teléfono", async () => {
    const result = await authenticate({ kind: "phone", value: "5587654321" }, disabled);
    expect(result).toMatchObject({ ok: true, user: { id: "usr_luis" } });
  });

  it("no confunde un teléfono con un email", async () => {
    const result = await authenticate({ kind: "email", value: "5512345678" }, disabled);
    expect(result).toEqual({ ok: false, reason: "INVALID_CREDENTIALS" });
  });
});

describe("[SPEC-AUTH-R05] usuario no registrado", () => {
  it("rechaza un identificador válido que no existe", async () => {
    const result = await authenticate({ kind: "email", value: "nadie@miniwallet.dev" }, disabled);
    expect(result).toEqual({ ok: false, reason: "INVALID_CREDENTIALS" });
  });
});

describe("[SPEC-AUTH-R06] error de servicio simulado", () => {
  it("con escenarios de prueba habilitados, el email reservado falla", async () => {
    const result = await authenticate({ kind: "email", value: SIMULATED_ERROR_EMAIL }, enabled);
    expect(result).toEqual({ ok: false, reason: "SERVICE_UNAVAILABLE" });
  });

  it("con escenarios deshabilitados, el email reservado es un usuario inexistente", async () => {
    const result = await authenticate({ kind: "email", value: SIMULATED_ERROR_EMAIL }, disabled);
    expect(result).toEqual({ ok: false, reason: "INVALID_CREDENTIALS" });
  });
});
