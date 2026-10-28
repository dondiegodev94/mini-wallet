import type { AccountType } from "@/domain/models/contact";

export const ACCOUNT_GROUPS: Record<AccountType, readonly number[]> = {
  PHONE: [2, 4, 4],
  CARD: [4, 4, 4, 4],
  CLABE: [3, 3, 4, 4, 4],
};

export const ACCOUNT_LENGTH: Record<AccountType, number> = {
  PHONE: 10,
  CARD: 16,
  CLABE: 18,
};

const ACCOUNT_SEPARATORS = /[\s\-()]/g;
const DIGITS = /^\d*$/;
const CLABE_WEIGHTS = [3, 7, 1] as const;

// Devuelve solo los dígitos o `null` si el cambio debe descartarse completo.
export function sanitizeAccountInput(raw: string, type: AccountType): string | null {
  const digits = raw.replace(ACCOUNT_SEPARATORS, "");
  if (!DIGITS.test(digits) || digits.length > ACCOUNT_LENGTH[type]) return null;
  return digits;
}

export function formatAccountNumber(digits: string, type: AccountType): string {
  const blocks: string[] = [];
  let start = 0;
  for (const size of ACCOUNT_GROUPS[type]) {
    if (start >= digits.length) break;
    blocks.push(digits.slice(start, start + size));
    start += size;
  }
  return blocks.join(" ");
}

export function maskAccount(digits: string): string {
  return `•••• ${digits.slice(-4)}`;
}

export function isValidLuhn(digits: string): boolean {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return digits.length > 0 && sum % 10 === 0;
}

export function isValidClabe(digits: string): boolean {
  if (digits.length !== ACCOUNT_LENGTH.CLABE) return false;
  let sum = 0;
  for (let index = 0; index < ACCOUNT_LENGTH.CLABE - 1; index += 1) {
    sum += (Number(digits[index]) * CLABE_WEIGHTS[index % CLABE_WEIGHTS.length]) % 10;
  }
  return (10 - (sum % 10)) % 10 === Number(digits[ACCOUNT_LENGTH.CLABE - 1]);
}
