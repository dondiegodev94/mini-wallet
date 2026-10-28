import { LOGIN_MESSAGES, loginSchema, normalizeIdentifier } from "./login.schema";

function firstMessage(input: unknown): string | undefined {
  const result = loginSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("[SPEC-AUTH-R01] identificador obligatorio", () => {
  it.each(["", "   ", "\t\n"])("rechaza %j", (identifier) => {
    expect(firstMessage({ identifier })).toBe(LOGIN_MESSAGES.required);
  });

  it("rechaza la ausencia del campo", () => {
    expect(firstMessage({})).toBe(LOGIN_MESSAGES.required);
  });

  it("rechaza un cuerpo que no es objeto", () => {
    expect(firstMessage(undefined)).toBe(LOGIN_MESSAGES.invalidRequest);
  });
});

describe("[SPEC-AUTH-R02] email", () => {
  it("recorta espacios y normaliza a minúsculas", () => {
    expect(loginSchema.parse({ identifier: "  ANA@MiniWallet.dev " })).toEqual({
      identifier: { kind: "email", value: "ana@miniwallet.dev" },
    });
  });

  it.each(["ana@", "@miniwallet.dev", "ana@miniwallet", "ana @miniwallet.dev"])(
    "rechaza el formato inválido %j",
    (identifier) => {
      expect(firstMessage({ identifier })).toBe(LOGIN_MESSAGES.invalidEmail);
    },
  );
});

describe("[SPEC-AUTH-R03] teléfono", () => {
  it.each([
    ["5512345678", "5512345678"],
    ["55 1234 5678", "5512345678"],
    ["(55) 1234-5678", "5512345678"],
    ["+52 55 1234 5678", "5512345678"],
    ["525512345678", "5512345678"],
    ["5212345678", "5212345678"],
  ])("normaliza %j a %j", (identifier, expected) => {
    expect(loginSchema.parse({ identifier })).toEqual({
      identifier: { kind: "phone", value: expected },
    });
  });

  it.each(["55123", "551234567", "55123456789", "55abc45678", "+1 555 123 4567"])(
    "rechaza %j",
    (identifier) => {
      expect(firstMessage({ identifier })).toBe(LOGIN_MESSAGES.invalidPhone);
    },
  );
});

describe("[SPEC-AUTH-R04] identificador normalizado", () => {
  it("variantes del mismo email producen el mismo identificador", () => {
    expect(normalizeIdentifier(" ANA@miniwallet.dev")).toEqual(
      normalizeIdentifier("ana@MINIWALLET.dev "),
    );
  });

  it("variantes del mismo teléfono producen el mismo identificador", () => {
    expect(normalizeIdentifier("+52 (55) 1234-5678")).toEqual(normalizeIdentifier("5512345678"));
  });
});
