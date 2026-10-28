/** @jest-environment node */
import { GET } from "./route";
import { SESSION_COOKIE, createSessionToken } from "@/server/auth/session";
import { walletSummarySchema } from "@/domain/contracts/wallet";

const SECRET = "test-secret-with-at-least-32-characters";
let sessionToken: string | undefined;

jest.mock("@/server/mock/latency", () => ({ simulateLatency: () => Promise.resolve() }));
jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  connection: async () => undefined,
}));
jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === SESSION_COOKIE && sessionToken ? { name, value: sessionToken } : undefined,
  }),
}));

function getWallet(headers: Record<string, string> = {}) {
  return GET(new Request("http://localhost/api/wallet", { headers }));
}

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.ENABLE_TEST_SCENARIOS = "true";
  sessionToken = undefined;
});

describe("GET /api/wallet", () => {
  it("[SPEC-HOME-R07] sin sesión responde 401", async () => {
    const response = await getWallet();

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("[SPEC-HOME-R07] con una sesión alterada responde 401", async () => {
    sessionToken = `${createSessionToken("usr_ana", SECRET).token}x`;
    expect((await getWallet()).status).toBe(401);
  });

  it("[SPEC-HOME-R07] devuelve el resumen del usuario de la sesión", async () => {
    sessionToken = createSessionToken("usr_luis", SECRET).token;
    const response = await getWallet();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(walletSummarySchema.safeParse(body).success).toBe(true);
    expect(body.user).toEqual({ id: "usr_luis", name: "Luis Pérez" });
  });

  it("una sesión de un usuario inexistente responde 401", async () => {
    sessionToken = createSessionToken("usr_fantasma", SECRET).token;
    expect((await getWallet()).status).toBe(401);
  });

  it("[SPEC-HOME-R08] el escenario WALLET_UNAVAILABLE responde 503", async () => {
    sessionToken = createSessionToken("usr_ana", SECRET).token;
    const response = await getWallet({ "x-mock-scenario": "WALLET_UNAVAILABLE" });

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "SERVICE_UNAVAILABLE" } });
  });
});
