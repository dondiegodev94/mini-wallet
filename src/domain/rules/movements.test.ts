import type { Movement } from "@/domain/models/wallet";
import { RECENT_MOVEMENTS_LIMIT, selectRecentMovements } from "./movements";

function movement(id: string, occurredAt: string): Movement {
  return { id, type: "DEBIT", amountCents: 100, counterparty: "X", concept: "Y", occurredAt };
}

describe("[SPEC-HOME-R04] orden de movimientos", () => {
  it("ordena del más reciente al más antiguo aunque lleguen desordenados", () => {
    const result = selectRecentMovements([
      movement("b", "2026-10-02T10:00:00.000Z"),
      movement("c", "2026-10-03T10:00:00.000Z"),
      movement("a", "2026-10-01T10:00:00.000Z"),
    ]);

    expect(result.map((item) => item.id)).toEqual(["c", "b", "a"]);
  });

  it("no muta la lista original", () => {
    const original = [movement("a", "2026-10-01T10:00:00.000Z"), movement("b", "2026-10-02T10:00:00.000Z")];

    selectRecentMovements(original);

    expect(original.map((item) => item.id)).toEqual(["a", "b"]);
  });
});

describe("[SPEC-HOME-R05] límite de movimientos recientes", () => {
  const many = Array.from({ length: 12 }, (_, index) =>
    movement(`m${index + 1}`, `2026-10-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`),
  );

  it("el límite es 10", () => {
    expect(RECENT_MOVEMENTS_LIMIT).toBe(10);
  });

  it("con más de 10 devuelve solo los 10 más recientes", () => {
    const result = selectRecentMovements(many);

    expect(result).toHaveLength(10);
    expect(result[0]?.id).toBe("m12");
    expect(result.at(-1)?.id).toBe("m3");
  });

  it("con exactamente 10 los devuelve todos", () => {
    expect(selectRecentMovements(many.slice(0, 10))).toHaveLength(10);
  });

  it("sin movimientos devuelve una lista vacía", () => {
    expect(selectRecentMovements([])).toEqual([]);
  });
});
