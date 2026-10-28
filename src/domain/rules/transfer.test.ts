import {
  TRANSFER_MESSAGES,
  firstInvalidField,
  normalizeConcept,
  validateTransfer,
  type TransferDraftInput,
} from "./transfer";

const BALANCE = 1245075;
const VALID: TransferDraftInput = { amountCents: 125050, contactId: "ct_mariana", concept: "Renta" };

describe("validateTransfer", () => {
  it("un borrador válido no tiene errores", () => {
    expect(validateTransfer(VALID, BALANCE)).toEqual({});
  });

  it("[SPEC-TX-R01] el monto es obligatorio", () => {
    expect(validateTransfer({ ...VALID, amountCents: null }, BALANCE).amount).toBe(
      TRANSFER_MESSAGES.amountRequired,
    );
  });

  it.each([0, -100, 10.5, Number.NaN])("[SPEC-TX-R01] rechaza un monto de %p centavos", (amountCents) => {
    expect(validateTransfer({ ...VALID, amountCents }, BALANCE).amount).toBe(
      TRANSFER_MESSAGES.amountPositive,
    );
  });

  it("[SPEC-TX-R02] rechaza un monto mayor al saldo con el saldo formateado", () => {
    expect(validateTransfer({ ...VALID, amountCents: BALANCE + 1 }, BALANCE).amount).toBe(
      "El monto supera tu saldo disponible de $12,450.75.",
    );
  });

  it("[SPEC-TX-R02] permite transferir exactamente el saldo", () => {
    expect(validateTransfer({ ...VALID, amountCents: BALANCE }, BALANCE)).toEqual({});
  });

  it("[SPEC-TX-R02] con saldo en cero cualquier monto es inválido", () => {
    expect(validateTransfer({ ...VALID, amountCents: 1 }, 0).amount).toBe(
      "El monto supera tu saldo disponible de $0.00.",
    );
  });

  it("[SPEC-TX-R08] el destinatario es obligatorio", () => {
    expect(validateTransfer({ ...VALID, contactId: null }, BALANCE).contactId).toBe(
      TRANSFER_MESSAGES.recipientRequired,
    );
    expect(validateTransfer({ ...VALID, contactId: "" }, BALANCE).contactId).toBe(
      TRANSFER_MESSAGES.recipientRequired,
    );
  });

  it("[SPEC-TX-R09] el concepto es opcional y admite hasta 40 caracteres", () => {
    expect(validateTransfer({ ...VALID, concept: "" }, BALANCE)).toEqual({});
    expect(validateTransfer({ ...VALID, concept: `  ${"a".repeat(40)}  ` }, BALANCE)).toEqual({});
    expect(validateTransfer({ ...VALID, concept: "a".repeat(41) }, BALANCE).concept).toBe(
      TRANSFER_MESSAGES.conceptTooLong,
    );
  });

  it("[SPEC-TX-R16] reporta todos los errores e identifica el primero", () => {
    const errors = validateTransfer({ amountCents: null, contactId: null, concept: "" }, BALANCE);
    expect(Object.keys(errors)).toEqual(["amount", "contactId"]);
    expect(firstInvalidField(errors)).toBe("amount");
    expect(firstInvalidField({ contactId: "x" })).toBe("contactId");
    expect(firstInvalidField({})).toBeNull();
  });
});

describe("[SPEC-TX-R09] normalizeConcept", () => {
  it("recorta y colapsa espacios", () => {
    expect(normalizeConcept("  Pago   de  renta ")).toBe("Pago de renta");
  });
});
