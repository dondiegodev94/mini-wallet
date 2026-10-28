/** @jest-environment node */
import { SESSION_TTL_MS, createSessionToken, verifySessionToken } from "./session";

const SECRET = "test-secret-with-at-least-32-characters";
const NOW = Date.UTC(2026, 0, 1);

describe("[SPEC-AUTH-R07] token de sesión firmado", () => {
  it("un token emitido se verifica y conserva el userId", () => {
    const { token, expiresAt } = createSessionToken("usr_ana", SECRET, NOW);
    expect(verifySessionToken(token, SECRET, NOW)).toEqual({ userId: "usr_ana", expiresAt });
  });

  it("sin token no hay sesión", () => {
    expect(verifySessionToken(undefined, SECRET, NOW)).toBeNull();
  });

  it("rechaza un token firmado con otro secreto", () => {
    const { token } = createSessionToken("usr_ana", SECRET, NOW);
    expect(verifySessionToken(token, `${SECRET}-other`, NOW)).toBeNull();
  });

  it("rechaza un payload alterado", () => {
    const { token } = createSessionToken("usr_ana", SECRET, NOW);
    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "usr_luis", exp: NOW + SESSION_TTL_MS })).toString(
      "base64url",
    );
    expect(verifySessionToken(`${forged}.${signature}`, SECRET, NOW)).toBeNull();
  });

  it.each(["", "sin-punto", "a.b.c", ".firma", "payload."])("rechaza el token mal formado %j", (token) => {
    expect(verifySessionToken(token, SECRET, NOW)).toBeNull();
  });
});

describe("[SPEC-AUTH-R08] expiración a los 30 minutos", () => {
  it("expira exactamente 30 minutos después de su emisión", () => {
    const { expiresAt } = createSessionToken("usr_ana", SECRET, NOW);
    expect(expiresAt - NOW).toBe(30 * 60 * 1000);
  });

  it("es válido un instante antes de expirar e inválido al expirar", () => {
    const { token, expiresAt } = createSessionToken("usr_ana", SECRET, NOW);
    expect(verifySessionToken(token, SECRET, expiresAt - 1)).not.toBeNull();
    expect(verifySessionToken(token, SECRET, expiresAt)).toBeNull();
  });
});
