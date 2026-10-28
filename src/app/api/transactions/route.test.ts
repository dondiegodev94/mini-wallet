/** @jest-environment node */
import { POST } from "./route";
import { SESSION_COOKIE, createSessionToken } from "@/server/auth/session";
import { transactionCreatedResponseSchema } from "@/domain/contracts/transactions";
import { contactRepository } from "@/server/contacts/contactRepository";
import { simulateLatency } from "@/server/mock/latency";
import { idempotencyStore } from "@/server/transactions/idempotencyStore";
import { TIMEOUT_RESPONSE_DELAY_MS } from "@/server/transactions/transactionService";
import { walletRepository } from "@/server/wallet/walletRepository";

const SECRET = "test-secret-with-at-least-32-characters";
const ANA_BALANCE = 1245075;
let sessionToken: string | undefined;

jest.mock("@/server/mock/latency", () => ({ simulateLatency: jest.fn(() => Promise.resolve()) }));
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

const TRANSFER = { contactId: "ct_mariana", amountCents: 125050, concept: "Renta" };

type PostOptions = { key?: string | null; scenario?: string; body?: unknown };

function loginAs(userId: string) {
  sessionToken = createSessionToken(userId, SECRET).token;
}

function post({ key = crypto.randomUUID(), scenario = "SUCCESS", body = TRANSFER }: PostOptions = {}) {
  const headers = new Headers({ "x-mock-scenario": scenario });
  if (key) headers.set("Idempotency-Key", key);
  return POST(
    new Request("http://localhost/api/transactions", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function errorCode(response: Response) {
  return (await response.json()).error.code;
}

function anaBalance() {
  return walletRepository.getBalance("usr_ana");
}

async function anaMovements() {
  return (await walletRepository.findByUserId("usr_ana"))?.movements ?? [];
}

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
  process.env.ENABLE_TEST_SCENARIOS = "true";
  sessionToken = undefined;
  walletRepository.reset();
  contactRepository.reset();
  idempotencyStore.reset();
  jest.mocked(simulateLatency).mockClear();
});

describe("[SPEC-CONF-R01] validación en servidor", () => {
  it("sin sesión responde 401", async () => {
    const response = await post();
    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe("UNAUTHORIZED");
  });

  it.each([null, "no-es-uuid"])("[SPEC-CONF-R03] con Idempotency-Key %p responde 400", async (key) => {
    loginAs("usr_ana");
    const response = await post({ key });

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe("IDEMPOTENCY_KEY_INVALID");
    expect(anaBalance()).toBe(ANA_BALANCE);
  });

  it.each([
    ["monto cero", { ...TRANSFER, amountCents: 0 }],
    ["monto negativo", { ...TRANSFER, amountCents: -100 }],
    ["monto decimal", { ...TRANSFER, amountCents: 10.5 }],
    ["sin destinatario", { amountCents: 100 }],
    ["campos extra", { ...TRANSFER, balanceCents: 99999999 }],
    ["JSON inválido", "{nope"],
  ])("[SPEC-CONF-AC12] rechaza %s con 400", async (_, body) => {
    loginAs("usr_ana");
    const response = await post({ body });

    expect(response.status).toBe(400);
    expect(await errorCode(response)).toBe("VALIDATION_ERROR");
    expect(anaBalance()).toBe(ANA_BALANCE);
  });

  it("[SPEC-CONF-AC12] rechaza un destinatario inexistente con 422", async () => {
    loginAs("usr_ana");
    const response = await post({ body: { ...TRANSFER, contactId: "ct_nadie" } });

    expect(response.status).toBe(422);
    expect(await errorCode(response)).toBe("RECIPIENT_NOT_FOUND");
  });

  it("[SPEC-CONF-AC12] rechaza el contacto de otro usuario con 422", async () => {
    loginAs("usr_luis");
    const response = await post();

    expect(response.status).toBe(422);
    expect(await errorCode(response)).toBe("RECIPIENT_NOT_FOUND");
    expect(walletRepository.getBalance("usr_luis")).toBe(300000);
  });

  it("[SPEC-CONF-AC06] rechaza un monto mayor al saldo real aunque el escenario sea SUCCESS", async () => {
    loginAs("usr_ana");
    const response = await post({ body: { ...TRANSFER, amountCents: ANA_BALANCE + 1 } });

    expect(response.status).toBe(422);
    expect(await errorCode(response)).toBe("INSUFFICIENT_FUNDS");
    expect(anaBalance()).toBe(ANA_BALANCE);
  });
});

describe("[SPEC-CONF-R11] respuesta por escenario", () => {
  it("[SPEC-CONF-AC01][SPEC-CONF-R12] SUCCESS descuenta, registra el movimiento y devuelve el saldo resultante", async () => {
    loginAs("usr_ana");
    const response = await post();
    const { transaction } = transactionCreatedResponseSchema.parse(await response.json());

    expect(response.status).toBe(201);
    expect(response.headers.get("Idempotent-Replayed")).toBeNull();
    expect(transaction).toMatchObject({
      amountCents: 125050,
      concept: "Renta",
      recipient: { name: "Mariana Soto", bank: "BBVA", accountType: "CLABE", maskedAccount: "•••• 7899" },
      balanceAfterCents: ANA_BALANCE - 125050,
    });
    expect(transaction.reference).toMatch(/^MW\d{8}$/);
    expect(anaBalance()).toBe(ANA_BALANCE - 125050);

    const [latest] = await anaMovements();
    expect(latest).toMatchObject({
      type: "DEBIT",
      amountCents: 125050,
      counterparty: "Mariana Soto",
      concept: "Renta",
      occurredAt: transaction.createdAt,
    });
  });

  it("[SPEC-CONF-R12] sin concepto registra «Transferencia»", async () => {
    loginAs("usr_ana");
    const response = await post({ body: { contactId: "ct_luis", amountCents: 100 } });
    const { transaction } = transactionCreatedResponseSchema.parse(await response.json());

    expect(transaction.concept).toBe("Transferencia");
    expect((await anaMovements())[0]?.concept).toBe("Transferencia");
  });

  it("[SPEC-TX-AC05] permite transferir exactamente el saldo disponible", async () => {
    loginAs("usr_ana");
    const response = await post({ body: { ...TRANSFER, amountCents: ANA_BALANCE } });

    expect(response.status).toBe(201);
    expect(anaBalance()).toBe(0);
  });

  it.each([
    ["NETWORK_ERROR", 503, "SERVICE_UNAVAILABLE"],
    ["INSUFFICIENT_FUNDS", 422, "INSUFFICIENT_FUNDS"],
    ["UNKNOWN_ERROR", 500, "INTERNAL_ERROR"],
  ])("%s responde %i sin efectos", async (scenario, status, code) => {
    loginAs("usr_ana");
    const before = await anaMovements();
    const response = await post({ scenario });

    expect(response.status).toBe(status);
    expect(await errorCode(response)).toBe(code);
    expect(anaBalance()).toBe(ANA_BALANCE);
    expect(await anaMovements()).toEqual(before);
  });

  it("[SPEC-CONF-AC03] TIMEOUT procesa con éxito y responde después del límite del cliente", async () => {
    loginAs("usr_ana");
    const response = await post({ scenario: "TIMEOUT" });

    expect(response.status).toBe(201);
    expect(anaBalance()).toBe(ANA_BALANCE - 125050);
    expect(simulateLatency).toHaveBeenLastCalledWith(TIMEOUT_RESPONSE_DELAY_MS);
  });

  it("[SPEC-CONF-R10] sin escenarios habilitados ignora el header y usa el azar", async () => {
    process.env.ENABLE_TEST_SCENARIOS = "false";
    jest.spyOn(Math, "random").mockReturnValue(0);
    loginAs("usr_ana");

    const response = await post({ scenario: "UNKNOWN_ERROR" });

    expect(response.status).toBe(201);
    jest.mocked(Math.random).mockRestore();
  });
});

describe("Idempotencia", () => {
  it("[SPEC-CONF-AC10][SPEC-CONF-R05] repetir la misma solicitud devuelve el mismo 201 sin cobrar otra vez", async () => {
    loginAs("usr_ana");
    const key = crypto.randomUUID();
    const first = await (await post({ key })).json();

    const replay = await post({ key, scenario: "UNKNOWN_ERROR" });

    expect(replay.status).toBe(201);
    expect(replay.headers.get("Idempotent-Replayed")).toBe("true");
    expect(await replay.json()).toEqual(first);
    expect(anaBalance()).toBe(ANA_BALANCE - 125050);
    expect((await anaMovements()).filter((movement) => movement.counterparty === "Mariana Soto")).toHaveLength(2);
  });

  it("[SPEC-CONF-AC03] el reintento tras un timeout recupera el comprobante original", async () => {
    loginAs("usr_ana");
    const key = crypto.randomUUID();
    const original = await (await post({ key, scenario: "TIMEOUT" })).json();

    const retry = await post({ key, scenario: "SUCCESS" });

    expect(retry.headers.get("Idempotent-Replayed")).toBe("true");
    expect(await retry.json()).toEqual(original);
    expect(anaBalance()).toBe(ANA_BALANCE - 125050);
  });

  it("[SPEC-CONF-AC11][SPEC-CONF-R04] la misma clave con otro contenido responde 422", async () => {
    loginAs("usr_ana");
    const key = crypto.randomUUID();
    await post({ key });

    const response = await post({ key, body: { ...TRANSFER, amountCents: 1 } });

    expect(response.status).toBe(422);
    expect(await errorCode(response)).toBe("IDEMPOTENCY_KEY_REUSED");
    expect(anaBalance()).toBe(ANA_BALANCE - 125050);
  });

  it("[SPEC-CONF-R04] la clave tiene alcance por usuario", async () => {
    const key = crypto.randomUUID();
    loginAs("usr_ana");
    await post({ key });

    contactRepository.insert({ userId: "usr_luis", name: "Ana García", bank: "Mini Wallet", accountType: "PHONE", account: "5512345678" });
    const [anaContact] = contactRepository.listByUserId("usr_luis");
    loginAs("usr_luis");
    const response = await post({ key, body: { contactId: anaContact?.id, amountCents: 1000 } });

    expect(response.status).toBe(201);
    expect(response.headers.get("Idempotent-Replayed")).toBeNull();
    expect(walletRepository.getBalance("usr_luis")).toBe(299000);
  });

  it("[SPEC-CONF-R07][SPEC-CONF-AC02] un fallo no se almacena: el reintento con la misma clave se procesa", async () => {
    loginAs("usr_ana");
    const key = crypto.randomUUID();
    expect((await post({ key, scenario: "NETWORK_ERROR" })).status).toBe(503);

    const retry = await post({ key, scenario: "SUCCESS" });

    expect(retry.status).toBe(201);
    expect(retry.headers.get("Idempotent-Replayed")).toBeNull();
    expect(anaBalance()).toBe(ANA_BALANCE - 125050);
  });

  it("[SPEC-CONF-R06] dos solicitudes simultáneas con la misma clave cobran una sola vez", async () => {
    loginAs("usr_ana");
    const key = crypto.randomUUID();

    const responses = await Promise.all([post({ key }), post({ key })]);

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    const replayed = responses.map((response) => response.headers.get("Idempotent-Replayed"));
    expect(replayed).toEqual(expect.arrayContaining(["true", null]));
    expect(anaBalance()).toBe(ANA_BALANCE - 125050);
  });

  it("[SPEC-CONF-R02] transferencias simultáneas con claves distintas no dejan el saldo en negativo", async () => {
    loginAs("usr_ana");
    const body = { ...TRANSFER, amountCents: 1000000 };

    const responses = await Promise.all([post({ body }), post({ body })]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 422]);
    expect(anaBalance()).toBe(ANA_BALANCE - 1000000);
  });
});
