import { walletSummarySchema } from "./wallet";

const valid = {
  user: { id: "usr_ana", name: "Ana García" },
  balanceCents: 1245075,
  movements: [
    {
      id: "mov_1",
      type: "DEBIT",
      amountCents: 35000,
      counterparty: "Luis Pérez",
      concept: "Cena",
      occurredAt: "2026-10-26T02:15:00.000Z",
    },
  ],
};

describe("[SPEC-HOME-R01] montos en centavos enteros", () => {
  it("acepta un resumen válido", () => {
    expect(walletSummarySchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza un saldo con decimales", () => {
    expect(walletSummarySchema.safeParse({ ...valid, balanceCents: 12450.75 }).success).toBe(false);
  });

  it("rechaza un saldo negativo", () => {
    expect(walletSummarySchema.safeParse({ ...valid, balanceCents: -1 }).success).toBe(false);
  });

  it("acepta un saldo en cero", () => {
    expect(walletSummarySchema.safeParse({ ...valid, balanceCents: 0 }).success).toBe(true);
  });

  it.each([0, -100, 10.5])("rechaza el monto de movimiento %p", (amountCents) => {
    const movements = [{ ...valid.movements[0], amountCents }];
    expect(walletSummarySchema.safeParse({ ...valid, movements }).success).toBe(false);
  });

  it("rechaza un tipo de movimiento desconocido", () => {
    const movements = [{ ...valid.movements[0], type: "REFUND" }];
    expect(walletSummarySchema.safeParse({ ...valid, movements }).success).toBe(false);
  });
});
