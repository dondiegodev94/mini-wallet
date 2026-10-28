/** @jest-environment node */
import { DELETE, POST } from "./route";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";

jest.mock("@/server/mock/latency", () => ({ simulateLatency: () => Promise.resolve() }));

const SECRET = "test-secret-with-at-least-32-characters";

function postLogin(body: string) {
  return POST(
    new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }),
  );
}

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.ENABLE_TEST_SCENARIOS = "true";
});

describe("POST /api/auth", () => {
  it("[SPEC-AUTH-AC01] login exitoso devuelve el usuario y una sesión válida", async () => {
    const response = await postLogin(JSON.stringify({ identifier: "+52 55 1234 5678" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: { id: "usr_ana", name: "Ana García" } });

    const cookie = response.cookies.get(SESSION_COOKIE);
    expect(verifySessionToken(cookie?.value, SECRET)).toMatchObject({ userId: "usr_ana" });
  });

  it("[SPEC-AUTH-R09] la cookie es httpOnly, sameSite=lax y de alcance global", async () => {
    const response = await postLogin(JSON.stringify({ identifier: "ana@miniwallet.dev" }));
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(setCookie).toContain(`${SESSION_COOKIE}=`);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
    expect(setCookie).toMatch(/Path=\//);
    expect(setCookie).toMatch(/Expires=/);
  });

  it("[SPEC-AUTH-AC03] formato inválido responde 400 con el error del campo", async () => {
    const response = await postLogin(JSON.stringify({ identifier: "55123" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Ingresa un teléfono de 10 dígitos.",
        fieldErrors: { identifier: ["Ingresa un teléfono de 10 dígitos."] },
      },
    });
  });

  it.each(["", "no-es-json", "null"])("cuerpo inválido %j responde 400", async (body) => {
    const response = await postLogin(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
  });

  it("[SPEC-AUTH-AC04] usuario no registrado responde 401 sin emitir sesión", async () => {
    const response = await postLogin(JSON.stringify({ identifier: "nadie@miniwallet.dev" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "INVALID_CREDENTIALS", message: "No encontramos una cuenta con esos datos." },
    });
    expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
  });

  it("[SPEC-AUTH-AC05] el error simulado responde 503", async () => {
    const response = await postLogin(JSON.stringify({ identifier: "error@miniwallet.dev" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "SERVICE_UNAVAILABLE" } });
  });

  it("falla con un mensaje explícito si SESSION_SECRET no está configurado", async () => {
    delete process.env.SESSION_SECRET;
    await expect(postLogin(JSON.stringify({ identifier: "ana@miniwallet.dev" }))).rejects.toThrow(
      /SESSION_SECRET/,
    );
  });
});

describe("DELETE /api/auth", () => {
  it("responde 204 y elimina la cookie de sesión", () => {
    const response = DELETE();

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toMatch(
      new RegExp(`${SESSION_COOKIE}=;.*Expires=Thu, 01 Jan 1970`, "i"),
    );
  });
});
