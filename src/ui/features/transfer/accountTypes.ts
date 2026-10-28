import type { AccountType } from "@/domain/models/contact";
import type { SegmentedOption } from "@/ui/components/SegmentedControl/SegmentedControl";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  PHONE: "Celular",
  CARD: "Tarjeta",
  CLABE: "CLABE",
};

export const ACCOUNT_TYPE_OPTIONS: readonly SegmentedOption<AccountType>[] = [
  { value: "PHONE", label: ACCOUNT_TYPE_LABEL.PHONE },
  { value: "CARD", label: ACCOUNT_TYPE_LABEL.CARD },
  { value: "CLABE", label: ACCOUNT_TYPE_LABEL.CLABE },
];

export const ACCOUNT_FIELD_LABEL: Record<AccountType, string> = {
  PHONE: "Número de celular",
  CARD: "Número de tarjeta",
  CLABE: "Número de CLABE",
};

export const ACCOUNT_PLACEHOLDER: Record<AccountType, string> = {
  PHONE: "55 1234 5678",
  CARD: "0000 0000 0000 0000",
  CLABE: "000 000 0000 0000 0000",
};
