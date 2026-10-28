import { formatMoney } from "./money";

describe("[SPEC-HOME-R02] formato de moneda", () => {
  it.each([
    [1245075, "$12,450.75"],
    [0, "$0.00"],
    [50, "$0.50"],
    [2500000, "$25,000.00"],
  ])("%p centavos se muestran como %p", (cents, expected) => {
    expect(formatMoney(cents)).toBe(expected);
  });
});
