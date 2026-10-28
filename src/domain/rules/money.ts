const moneyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function formatMoney(cents: number): string {
  return moneyFormatter.format(cents / 100);
}
