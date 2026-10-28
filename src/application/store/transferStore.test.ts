import type { Contact } from "@/domain/models/contact";
import { resetTransferDraft, useTransferStore } from "./transferStore";

const MARIANA: Contact = {
  id: "ct_mariana",
  name: "Mariana Soto",
  bank: "BBVA",
  accountType: "CLABE",
  maskedAccount: "•••• 7899",
};
const CARLOS: Contact = { ...MARIANA, id: "ct_carlos", name: "Carlos Núñez" };
const REQUEST = { amountCents: 125050, contact: MARIANA, concept: "Renta", balanceCents: 1245075 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function store() {
  return useTransferStore.getState();
}

beforeEach(() => resetTransferDraft());

describe("[SPEC-TX-R10] borrador de transferencia", () => {
  it("guarda monto, destinatario y concepto", () => {
    store().setAmountInput("1250.50");
    store().selectContact(MARIANA);
    store().setConcept("Renta");

    expect(store()).toMatchObject({ amountInput: "1250.50", contact: MARIANA, concept: "Renta" });
  });
});

describe("[SPEC-TX-R13] Idempotency-Key", () => {
  it("genera una clave UUID v4 al pasar a revisión y normaliza el concepto", () => {
    const review = store().prepareReview({ ...REQUEST, concept: "  Renta  " });

    expect(review.idempotencyKey).toMatch(UUID);
    expect(review.concept).toBe("Renta");
    expect(store().review).toEqual(review);
  });

  it("conserva la clave si la intención no cambia", () => {
    const first = store().prepareReview(REQUEST);
    const second = store().prepareReview({ ...REQUEST, concept: " Renta", balanceCents: 1 });

    expect(second.idempotencyKey).toBe(first.idempotencyKey);
  });

  it.each([
    ["el monto", { amountCents: 125051 }],
    ["el destinatario", { contact: CARLOS }],
    ["el concepto", { concept: "Renta de noviembre" }],
  ])("regenera la clave si cambia %s", (_, change) => {
    const first = store().prepareReview(REQUEST);
    const second = store().prepareReview({ ...REQUEST, ...change });

    expect(second.idempotencyKey).toMatch(UUID);
    expect(second.idempotencyKey).not.toBe(first.idempotencyKey);
  });
});

describe("[SPEC-TX-R14] descarte del borrador", () => {
  it("reset descarta el borrador y su clave", () => {
    store().setAmountInput("10");
    store().selectContact(MARIANA);
    const first = store().prepareReview(REQUEST);

    resetTransferDraft();

    expect(store()).toMatchObject({ amountInput: "", contact: null, concept: "", review: null });
    expect(store().prepareReview(REQUEST).idempotencyKey).not.toBe(first.idempotencyKey);
  });
});

describe("Envío de la transferencia", () => {
  const PENDING = { idempotencyKey: "key-1", contact: MARIANA, amountCents: 125050, concept: "Renta" };
  const TRANSACTION = {
    id: "tx_1",
    reference: "MW00000001",
    amountCents: 125050,
    concept: "Renta",
    createdAt: "2026-10-28T18:42:10.000Z",
    recipient: { name: "Mariana Soto", bank: "BBVA" as const, accountType: "CLABE" as const, maskedAccount: "•••• 7899" },
    balanceAfterCents: 1120025,
  };

  it("[SPEC-CONF-R15] al confirmar descarta el borrador editable y queda procesando", () => {
    store().setAmountInput("1250.50");
    store().selectContact(MARIANA);
    store().prepareReview(REQUEST);

    store().beginSubmission(PENDING);

    expect(store()).toMatchObject({ amountInput: "", contact: null, concept: "", review: null });
    expect(store().submission).toEqual({ phase: "processing", pending: PENDING });
  });

  it.each(["NETWORK_ERROR", "TIMEOUT"] as const)(
    "[SPEC-CONF-R20] %s conserva el envío para reintentar",
    (status) => {
      store().beginSubmission(PENDING);
      store().completeSubmission(PENDING.idempotencyKey, { status });

      expect(store().submission).toEqual({ phase: "done", outcome: { status }, pending: PENDING });
    },
  );

  it.each([
    ["SUCCESS", { status: "SUCCESS" as const, transaction: TRANSACTION }],
    ["INSUFFICIENT_FUNDS", { status: "INSUFFICIENT_FUNDS" as const }],
    ["UNKNOWN_ERROR", { status: "UNKNOWN_ERROR" as const }],
  ])("[SPEC-CONF-R20] %s es final y descarta el envío", (_, outcome) => {
    store().beginSubmission(PENDING);
    store().completeSubmission(PENDING.idempotencyKey, outcome);

    expect(store().submission).toEqual({ phase: "done", outcome, pending: null });
  });

  it("ignora la respuesta de un envío que ya no está en curso", () => {
    store().beginSubmission(PENDING);
    store().beginSubmission({ ...PENDING, idempotencyKey: "key-2" });

    store().completeSubmission("key-1", { status: "UNKNOWN_ERROR" });

    expect(store().submission?.phase).toBe("processing");
  });

  it("un resumen nuevo descarta el resultado anterior", () => {
    store().beginSubmission(PENDING);
    store().completeSubmission(PENDING.idempotencyKey, { status: "UNKNOWN_ERROR" });

    store().prepareReview(REQUEST);

    expect(store().submission).toBeNull();
  });

  it("un resumen nuevo conserva un envío que sigue en curso", () => {
    store().beginSubmission(PENDING);
    store().prepareReview(REQUEST);
    expect(store().submission?.phase).toBe("processing");
  });

  it("[SPEC-CONF-R18] reset descarta también el envío", () => {
    store().beginSubmission(PENDING);
    resetTransferDraft();
    expect(store().submission).toBeNull();
  });
});
