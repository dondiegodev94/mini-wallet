import { z } from "zod";
import { CONTACT_MESSAGES, contactInputSchema } from "./contact.schema";

const VALID = {
  name: "Mariana Soto",
  accountType: "CLABE",
  account: "012180001234567899",
  bank: "BBVA",
};

function fieldErrors(input: unknown) {
  const result = contactInputSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("contactInputSchema", () => {
  it("acepta un contacto válido de cada tipo", () => {
    expect(contactInputSchema.safeParse(VALID).success).toBe(true);
    expect(
      contactInputSchema.safeParse({ ...VALID, accountType: "CARD", account: "4915600212345675" })
        .success,
    ).toBe(true);
    expect(
      contactInputSchema.safeParse({ ...VALID, accountType: "PHONE", account: "5587654321" }).success,
    ).toBe(true);
  });

  it("[SPEC-CT-R01] normaliza el nombre y valida su longitud", () => {
    const parsed = contactInputSchema.parse({ ...VALID, name: "  María   José  " });
    expect(parsed.name).toBe("María José");

    expect(fieldErrors({ ...VALID, name: "   " }).name?.[0]).toBe(CONTACT_MESSAGES.nameRequired);
    expect(fieldErrors({ ...VALID, name: "Al" }).name?.[0]).toBe(CONTACT_MESSAGES.nameLength);
    expect(fieldErrors({ ...VALID, name: "a".repeat(61) }).name?.[0]).toBe(
      CONTACT_MESSAGES.nameLength,
    );
  });

  it("[SPEC-CT-R02] el tipo de cuenta es obligatorio y de catálogo", () => {
    expect(fieldErrors({ ...VALID, accountType: "IBAN" }).accountType?.[0]).toBe(
      CONTACT_MESSAGES.accountTypeRequired,
    );
  });

  it.each([
    ["PHONE", "", CONTACT_MESSAGES.accountRequired.PHONE],
    ["PHONE", "551234567", CONTACT_MESSAGES.accountLength.PHONE],
    ["CARD", "491560021234567", CONTACT_MESSAGES.accountLength.CARD],
    ["CLABE", "01218000123456789", CONTACT_MESSAGES.accountLength.CLABE],
    ["CLABE", "4915600212345675", CONTACT_MESSAGES.accountLength.CLABE],
    ["PHONE", "55 1234 5678", CONTACT_MESSAGES.accountLength.PHONE],
    ["PHONE", "55abc45678", CONTACT_MESSAGES.accountLength.PHONE],
  ])("[SPEC-CT-R03] %p %p → %p", (accountType, account, message) => {
    expect(fieldErrors({ ...VALID, accountType, account }).account?.[0]).toBe(message);
  });

  it("[SPEC-CT-R04] valida el dígito verificador de tarjeta y CLABE", () => {
    expect(
      fieldErrors({ ...VALID, accountType: "CARD", account: "4915600212345670" }).account?.[0],
    ).toBe(CONTACT_MESSAGES.invalidCard);
    expect(fieldErrors({ ...VALID, account: "012180001234567890" }).account?.[0]).toBe(
      CONTACT_MESSAGES.invalidClabe,
    );
  });

  it("[SPEC-CT-R05] el banco debe ser del catálogo", () => {
    expect(fieldErrors({ ...VALID, bank: "Banco Patito" }).bank?.[0]).toBe(
      CONTACT_MESSAGES.bankRequired,
    );
    expect(fieldErrors({ ...VALID, bank: "" }).bank?.[0]).toBe(CONTACT_MESSAGES.bankRequired);
  });

  it("reporta todos los campos inválidos a la vez", () => {
    const errors = fieldErrors({ name: "", accountType: "PHONE", account: "", bank: "" });
    expect(Object.keys(errors).sort()).toEqual(["account", "bank", "name"]);
  });

  it("rechaza un cuerpo que no es objeto", () => {
    expect(contactInputSchema.safeParse(undefined).success).toBe(false);
  });
});
