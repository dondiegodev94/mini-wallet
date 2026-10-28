import { TRANSFER_MESSAGES } from "@/domain/rules/transfer";
import { idempotencyKeySchema, transferRequestSchema } from "./transactions";

const VALID = { contactId: "ct_mariana", amountCents: 125050, concept: "  Renta   de  octubre " };

function errorsOf(body: unknown) {
  const result = transferRequestSchema.safeParse(body);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
}

describe("[SPEC-CONF-R01] esquema de la solicitud de transferencia", () => {
  it("acepta una solicitud válida y normaliza el concepto", () => {
    expect(transferRequestSchema.parse(VALID)).toEqual({
      contactId: "ct_mariana",
      amountCents: 125050,
      concept: "Renta de octubre",
    });
  });

  it("el concepto es opcional", () => {
    expect(transferRequestSchema.parse({ contactId: "ct_luis", amountCents: 1 }).concept).toBe("");
  });

  it.each([
    ["cero", 0],
    ["negativo", -100],
    ["con decimales", 10.5],
    ["fuera del rango seguro", Number.MAX_SAFE_INTEGER + 1],
  ])("[SPEC-TX-R01][SPEC-TX-R03] rechaza un monto %s", (_, amountCents) => {
    expect(errorsOf({ ...VALID, amountCents }).amountCents).toBe(TRANSFER_MESSAGES.amountPositive);
  });

  it("rechaza un monto que no es número", () => {
    expect(errorsOf({ ...VALID, amountCents: "100" }).amountCents).toBe(TRANSFER_MESSAGES.amountRequired);
  });

  it.each([undefined, "", "   "])("[SPEC-TX-R08] rechaza un destinatario vacío (%p)", (contactId) => {
    expect(errorsOf({ ...VALID, contactId }).contactId).toBe(TRANSFER_MESSAGES.recipientRequired);
  });

  it("[SPEC-TX-R09] rechaza un concepto de más de 40 caracteres", () => {
    expect(errorsOf({ ...VALID, concept: "a".repeat(41) }).concept).toBe(TRANSFER_MESSAGES.conceptTooLong);
  });

  it("rechaza campos extra", () => {
    expect(transferRequestSchema.safeParse({ ...VALID, balanceCents: 1 }).success).toBe(false);
  });
});

describe("[SPEC-CONF-R03] Idempotency-Key", () => {
  it("acepta un UUID", () => {
    expect(idempotencyKeySchema.safeParse(crypto.randomUUID()).success).toBe(true);
  });

  it.each(["", "abc", "123e4567e89b12d3a456426614174000"])("rechaza %p", (key) => {
    expect(idempotencyKeySchema.safeParse(key).success).toBe(false);
  });
});
