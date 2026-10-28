/** @jest-environment node */
import type { Transaction } from "@/domain/models/transaction";
import { TRANSFER_TIMEOUT_MS } from "@/application/config";
import { TRANSACTIONS_ENDPOINT, sendTransfer, toTransferOutcome, type PendingTransfer } from "./sendTransfer";

const TRANSACTION: Transaction = {
  id: "tx_1",
  reference: "MW00000001",
  amountCents: 125050,
  concept: "Renta",
  createdAt: "2026-10-28T18:42:10.000Z",
  recipient: { name: "Mariana Soto", bank: "BBVA", accountType: "CLABE", maskedAccount: "•••• 7899" },
  balanceAfterCents: 1120025,
};

const PENDING: PendingTransfer = {
  idempotencyKey: "0b7e2f3a-1c4d-4e5f-8a9b-0c1d2e3f4a5b",
  contact: { id: "ct_mariana", name: "Mariana Soto", bank: "BBVA", accountType: "CLABE", maskedAccount: "•••• 7899" },
  amountCents: 125050,
  concept: "Renta",
};

function httpFailure(status: number, code?: string) {
  return {
    ok: false as const,
    kind: "http" as const,
    status,
    error: code ? { code: code as "INTERNAL_ERROR", message: "x" } : null,
  };
}

describe("[SPEC-CONF-R17] resultado según la respuesta", () => {
  it.each([
    ["201", { ok: true as const, data: { transaction: TRANSACTION } }, { status: "SUCCESS", transaction: TRANSACTION }],
    ["503", httpFailure(503, "SERVICE_UNAVAILABLE"), { status: "NETWORK_ERROR" }],
    ["fallo de fetch", { ok: false as const, kind: "network" as const }, { status: "NETWORK_ERROR" }],
    ["aborto por tiempo límite", { ok: false as const, kind: "timeout" as const }, { status: "TIMEOUT" }],
    ["422 INSUFFICIENT_FUNDS", httpFailure(422, "INSUFFICIENT_FUNDS"), { status: "INSUFFICIENT_FUNDS" }],
    ["401", httpFailure(401, "UNAUTHORIZED"), { status: "SESSION_EXPIRED" }],
    ["500", httpFailure(500, "INTERNAL_ERROR"), { status: "UNKNOWN_ERROR" }],
    ["422 RECIPIENT_NOT_FOUND", httpFailure(422, "RECIPIENT_NOT_FOUND"), { status: "UNKNOWN_ERROR" }],
    ["400 sin cuerpo conocido", httpFailure(400), { status: "UNKNOWN_ERROR" }],
    ["cuerpo fuera de contrato", { ok: false as const, kind: "unexpected-response" as const }, { status: "UNKNOWN_ERROR" }],
  ])("%s", (_, result, expected) => {
    expect(toTransferOutcome(result)).toEqual(expected);
  });
});

describe("sendTransfer", () => {
  const fetchMock = jest.spyOn(globalThis, "fetch");
  afterAll(() => fetchMock.mockRestore());

  it("[SPEC-CONF-R08] envía la Idempotency-Key del envío y el cuerpo del contrato", async () => {
    fetchMock.mockResolvedValue(Response.json({ transaction: TRANSACTION }, { status: 201 }));

    await expect(sendTransfer(PENDING)).resolves.toEqual({ status: "SUCCESS", transaction: TRANSACTION });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(TRANSACTIONS_ENDPOINT);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "Idempotency-Key": PENDING.idempotencyKey });
    expect(JSON.parse(String(init?.body))).toEqual({ contactId: "ct_mariana", amountCents: 125050, concept: "Renta" });
  });

  it("[SPEC-CONF-R13] aborta al vencer el tiempo límite de la transferencia", async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );

    const pending = sendTransfer(PENDING);
    await jest.advanceTimersByTimeAsync(TRANSFER_TIMEOUT_MS);

    await expect(pending).resolves.toEqual({ status: "TIMEOUT" });
    jest.useRealTimers();
  });
});
