import { z } from "zod";
import { ACCOUNT_TYPES, BANKS, type AccountType } from "@/domain/models/contact";
import { ACCOUNT_LENGTH, isValidClabe, isValidLuhn } from "@/domain/rules/account";

export const CONTACT_NAME_MIN_LENGTH = 3;
export const CONTACT_NAME_MAX_LENGTH = 60;

export const CONTACT_MESSAGES = {
  nameRequired: "Ingresa el nombre del contacto.",
  nameLength: "El nombre debe tener entre 3 y 60 caracteres.",
  accountTypeRequired: "Selecciona el tipo de cuenta.",
  bankRequired: "Selecciona el banco.",
  duplicate: "Ya tienes un contacto con esa cuenta.",
  invalidRequest: "Solicitud inválida.",
  accountRequired: {
    PHONE: "Ingresa el número de celular.",
    CARD: "Ingresa el número de tarjeta.",
    CLABE: "Ingresa la CLABE.",
  },
  accountLength: {
    PHONE: "El celular debe tener 10 dígitos.",
    CARD: "La tarjeta debe tener 16 dígitos.",
    CLABE: "La CLABE debe tener 18 dígitos.",
  },
  invalidCard: "El número de tarjeta no es válido.",
  invalidClabe: "La CLABE no es válida.",
} as const;

const DIGITS_ONLY = /^\d+$/;
const REPEATED_SPACES = /\s+/g;

export function normalizeContactName(raw: string): string {
  return raw.trim().replace(REPEATED_SPACES, " ");
}

export function accountError(type: AccountType, account: string): string | null {
  if (account === "") return CONTACT_MESSAGES.accountRequired[type];
  if (!DIGITS_ONLY.test(account) || account.length !== ACCOUNT_LENGTH[type]) {
    return CONTACT_MESSAGES.accountLength[type];
  }
  if (type === "CARD" && !isValidLuhn(account)) return CONTACT_MESSAGES.invalidCard;
  if (type === "CLABE" && !isValidClabe(account)) return CONTACT_MESSAGES.invalidClabe;
  return null;
}

const accountFieldsSchema = z.object({ accountType: z.enum(ACCOUNT_TYPES), account: z.string() });

export const contactInputSchema = z
  .object(
    {
      name: z
        .string({ error: CONTACT_MESSAGES.nameRequired })
        .transform(normalizeContactName)
        .pipe(
          z
            .string()
            .min(1, CONTACT_MESSAGES.nameRequired)
            .min(CONTACT_NAME_MIN_LENGTH, CONTACT_MESSAGES.nameLength)
            .max(CONTACT_NAME_MAX_LENGTH, CONTACT_MESSAGES.nameLength),
        ),
      accountType: z.enum(ACCOUNT_TYPES, { error: CONTACT_MESSAGES.accountTypeRequired }),
      account: z.string({ error: CONTACT_MESSAGES.accountRequired.PHONE }),
      bank: z.enum(BANKS, { error: CONTACT_MESSAGES.bankRequired }),
    },
    { error: CONTACT_MESSAGES.invalidRequest },
  )
  .superRefine(
    ({ accountType, account }, ctx) => {
      const message = accountError(accountType, account);
      if (message) ctx.addIssue({ code: "custom", path: ["account"], message });
    },
    // Corre aunque otros campos fallen, para mostrar todos los errores del formulario a la vez.
    { when: ({ value }) => accountFieldsSchema.safeParse(value).success },
  );

export type ContactInput = z.input<typeof contactInputSchema>;
export type NewContact = z.output<typeof contactInputSchema>;
