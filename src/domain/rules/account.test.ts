import {
  formatAccountNumber,
  isValidClabe,
  isValidLuhn,
  maskAccount,
  sanitizeAccountInput,
} from "./account";

describe("[SPEC-CT-R11] captura de solo dígitos", () => {
  it("ignora espacios, guiones y paréntesis", () => {
    expect(sanitizeAccountInput("(55) 1234-5678", "PHONE")).toBe("5512345678");
  });

  it.each(["55a", "55-ABCD-5678", "+5255", "12.3"])("descarta %p", (raw) => {
    expect(sanitizeAccountInput(raw, "PHONE")).toBeNull();
  });

  it("no admite más dígitos que la longitud del tipo", () => {
    expect(sanitizeAccountInput("55123456789", "PHONE")).toBeNull();
    expect(sanitizeAccountInput("49156002123456751", "CARD")).toBeNull();
    expect(sanitizeAccountInput("0121800012345678990", "CLABE")).toBeNull();
    expect(sanitizeAccountInput("012180001234567899", "CLABE")).toBe("012180001234567899");
  });
});

describe("[SPEC-CT-R12] máscara por tipo", () => {
  it.each([
    ["5512345678", "PHONE", "55 1234 5678"],
    ["4915600212345675", "CARD", "4915 6002 1234 5675"],
    ["012180001234567899", "CLABE", "012 180 0012 3456 7899"],
    ["551", "PHONE", "55 1"],
    ["01218", "CLABE", "012 18"],
    ["", "CARD", ""],
  ] as const)("%p como %p se muestra %p", (digits, type, formatted) => {
    expect(formatAccountNumber(digits, type)).toBe(formatted);
  });
});

describe("[SPEC-CT-R04] dígito verificador", () => {
  it("Luhn", () => {
    expect(isValidLuhn("4915600212345675")).toBe(true);
    expect(isValidLuhn("4027660012987659")).toBe(true);
    expect(isValidLuhn("4915600212345670")).toBe(false);
  });

  it("CLABE", () => {
    expect(isValidClabe("012180001234567899")).toBe(true);
    expect(isValidClabe("072180019876543216")).toBe(true);
    expect(isValidClabe("012180001234567890")).toBe(false);
    expect(isValidClabe("01218000123456789")).toBe(false);
  });
});

describe("[SPEC-CT-R07] número enmascarado", () => {
  it("solo muestra los últimos 4 dígitos", () => {
    expect(maskAccount("012180001234567899")).toBe("•••• 7899");
  });
});
