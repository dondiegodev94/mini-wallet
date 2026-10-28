import { z } from "zod";

export const LOGIN_MESSAGES = {
  required: "Ingresa tu teléfono o email.",
  invalidEmail: "Ingresa un email válido.",
  invalidPhone: "Ingresa un teléfono de 10 dígitos.",
  invalidRequest: "Solicitud inválida.",
} as const;

export type Identifier =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string };

const PHONE_SEPARATORS = /[\s\-()]/g;
const MX_COUNTRY_PREFIX = /^\+?52(?=\d{10}$)/;

const emailSchema = z.email(LOGIN_MESSAGES.invalidEmail);
const phoneSchema = z.string().regex(/^\d{10}$/, LOGIN_MESSAGES.invalidPhone);

export function normalizeIdentifier(raw: string): Identifier {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    return { kind: "email", value: trimmed.toLowerCase() };
  }
  return {
    kind: "phone",
    value: trimmed.replace(PHONE_SEPARATORS, "").replace(MX_COUNTRY_PREFIX, ""),
  };
}

export const loginSchema = z.object(
  {
    identifier: z
      .string({ error: LOGIN_MESSAGES.required })
      .trim()
      .min(1, LOGIN_MESSAGES.required)
      .transform((raw, ctx) => {
        const identifier = normalizeIdentifier(raw);
        const formatSchema = identifier.kind === "email" ? emailSchema : phoneSchema;
        const result = formatSchema.safeParse(identifier.value);
        if (!result.success) {
          ctx.issues.push({
            code: "custom",
            message: result.error.issues[0]?.message ?? LOGIN_MESSAGES.required,
            input: raw,
          });
          return z.NEVER;
        }
        return identifier;
      }),
  },
  { error: LOGIN_MESSAGES.invalidRequest },
);

export type LoginInput = z.input<typeof loginSchema>;
export type LoginCredentials = z.output<typeof loginSchema>;
