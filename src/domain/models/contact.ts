export const ACCOUNT_TYPES = ["PHONE", "CARD", "CLABE"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const BANKS = [
  "Banamex",
  "Banco Azteca",
  "BanCoppel",
  "Banorte",
  "BBVA",
  "HSBC",
  "Inbursa",
  "Mini Wallet",
  "Nu México",
  "Santander",
  "Scotiabank",
] as const;

export type Bank = (typeof BANKS)[number];

export type Contact = {
  id: string;
  name: string;
  bank: Bank;
  accountType: AccountType;
  maskedAccount: string;
};
