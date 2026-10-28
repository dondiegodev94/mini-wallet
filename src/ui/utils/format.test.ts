import { formatDateTime, formatMovementAmount } from "./format";

describe("[SPEC-HOME-R03] signo según el tipo de movimiento", () => {
  it("un cargo se muestra con signo negativo", () => {
    expect(formatMovementAmount(35000, "DEBIT")).toBe("-$350.00");
  });

  it("un abono se muestra con signo positivo", () => {
    expect(formatMovementAmount(120000, "CREDIT")).toBe("+$1,200.00");
  });
});

describe("[SPEC-HOME-R06] fechas en America/Mexico_City", () => {
  it("una hora cercana a la medianoche UTC cae en el día anterior en CDMX", () => {
    expect(formatDateTime("2026-10-26T02:15:00.000Z")).toBe("25 oct 2026, 20:15");
  });

  it("formatea con día, mes abreviado, año y hora de 24 horas", () => {
    expect(formatDateTime("2026-10-01T15:00:00.000Z")).toBe("1 oct 2026, 09:00");
  });
});
