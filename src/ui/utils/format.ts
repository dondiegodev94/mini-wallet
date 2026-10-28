import type { MovementType } from "@/domain/models/wallet";

const LOCALE = "es-MX";
const CURRENCY = "MXN";
const TIME_ZONE = "America/Mexico_City";

const moneyFormatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY });

const signedMoneyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  signDisplay: "always",
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatMoney(cents: number): string {
  return moneyFormatter.format(cents / 100);
}

export function formatMovementAmount(cents: number, type: MovementType): string {
  const sign = type === "DEBIT" ? -1 : 1;
  return signedMoneyFormatter.format((sign * cents) / 100);
}

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}
