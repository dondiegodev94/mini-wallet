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
