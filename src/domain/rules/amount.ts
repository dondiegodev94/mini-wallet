export const AMOUNT_MAX_INTEGER_DIGITS = 7;
export const AMOUNT_MAX_DECIMALS = 2;

const FORMAT_SYMBOLS = /[$,\s]/g;
const AMOUNT_CHARACTERS = /^\d*\.?\d*$/;
const LEADING_ZEROS = /^0+(?=\d)/;
const THOUSANDS_BOUNDARY = /\B(?=(\d{3})+(?!\d))/g;

// Devuelve el valor canónico (dígitos y punto) o `null` si el cambio debe descartarse completo.
export function sanitizeAmountInput(raw: string): string | null {
  const stripped = raw.replace(FORMAT_SYMBOLS, "");
  if (!AMOUNT_CHARACTERS.test(stripped)) return null;

  const [rawInteger = "", decimals] = stripped.split(".");
  const integer = rawInteger.replace(LEADING_ZEROS, "");
  if (integer.length > AMOUNT_MAX_INTEGER_DIGITS) return null;
  if (decimals === undefined) return integer;
  if (decimals.length > AMOUNT_MAX_DECIMALS) return null;

  return `${integer || "0"}.${decimals}`;
}

export function formatAmountInput(canonical: string): string {
  const [integer = "", decimals] = canonical.split(".");
  const grouped = integer.replace(THOUSANDS_BOUNDARY, ",");
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
}

export function completeAmountInput(canonical: string): string {
  if (canonical === "") return "";
  const [integer = "", decimals = ""] = canonical.split(".");
  return `${integer || "0"}.${decimals.padEnd(AMOUNT_MAX_DECIMALS, "0")}`;
}

// Opera sobre la cadena: "0.29" → 29 (0.29 * 100 daría 28.999…).
export function parseAmountToCents(canonical: string): number | null {
  if (canonical === "") return null;
  const [integer = "", decimals = ""] = canonical.split(".");
  return Number(integer || "0") * 100 + Number(decimals.padEnd(AMOUNT_MAX_DECIMALS, "0"));
}
