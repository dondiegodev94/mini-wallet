import { formatMoney } from "@/domain/rules/money";

export const CONCEPT_MAX_LENGTH = 40;
export const DEFAULT_CONCEPT = "Transferencia";

export const TRANSFER_MESSAGES = {
  amountRequired: "Ingresa un monto.",
  amountPositive: "El monto debe ser mayor a $0.00.",
  recipientRequired: "Selecciona un destinatario.",
  conceptTooLong: "El concepto admite hasta 40 caracteres.",
  insufficientFunds: (balanceCents: number) =>
    `El monto supera tu saldo disponible de ${formatMoney(balanceCents)}.`,
} as const;

export const TRANSFER_FIELDS = ["amount", "contactId", "concept"] as const;

export type TransferField = (typeof TRANSFER_FIELDS)[number];
export type TransferErrors = Partial<Record<TransferField, string>>;

export type TransferDraftInput = {
  amountCents: number | null;
  contactId: string | null;
  concept: string;
};

const REPEATED_SPACES = /\s+/g;

export function normalizeConcept(raw: string): string {
  return raw.trim().replace(REPEATED_SPACES, " ");
}

function amountError(amountCents: number | null, balanceCents: number): string | undefined {
  if (amountCents === null) return TRANSFER_MESSAGES.amountRequired;
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return TRANSFER_MESSAGES.amountPositive;
  if (amountCents > balanceCents) return TRANSFER_MESSAGES.insufficientFunds(balanceCents);
  return undefined;
}

export function validateTransfer(draft: TransferDraftInput, balanceCents: number): TransferErrors {
  const errors: TransferErrors = {};

  const amount = amountError(draft.amountCents, balanceCents);
  if (amount) errors.amount = amount;
  if (!draft.contactId) errors.contactId = TRANSFER_MESSAGES.recipientRequired;
  if (normalizeConcept(draft.concept).length > CONCEPT_MAX_LENGTH) {
    errors.concept = TRANSFER_MESSAGES.conceptTooLong;
  }

  return errors;
}

export function firstInvalidField(errors: TransferErrors): TransferField | null {
  return TRANSFER_FIELDS.find((field) => errors[field] !== undefined) ?? null;
}
