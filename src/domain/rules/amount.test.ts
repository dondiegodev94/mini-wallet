import {
  completeAmountInput,
  formatAmountInput,
  parseAmountToCents,
  sanitizeAmountInput,
} from "./amount";

describe("[SPEC-TX-R03] conversión exacta a centavos", () => {
  it.each([
    ["0.29", 29],
    ["0.07", 7],
    ["1.1", 110],
    ["1.10", 110],
    ["1500", 150000],
    ["9999999.99", 999999999],
    ["0.", 0],
    ["0", 0],
  ])("%p equivale a %p centavos", (input, cents) => {
    expect(parseAmountToCents(input)).toBe(cents);
  });

  it("un campo vacío no tiene monto", () => {
    expect(parseAmountToCents("")).toBeNull();
  });
});

describe("[SPEC-TX-R04] solo dígitos y un punto decimal", () => {
  it.each(["12a", "-5", "+5", "1e5", "1.2.3", "abc"])("descarta %p", (raw) => {
    expect(sanitizeAmountInput(raw)).toBeNull();
  });

  it("ignora los símbolos de formato al pegar", () => {
    expect(sanitizeAmountInput("$1,234.56")).toBe("1234.56");
    expect(sanitizeAmountInput(" 1 500 ")).toBe("1500");
  });

  it("una coma tecleada no entra al valor", () => {
    expect(sanitizeAmountInput("1,234,")).toBe("1234");
  });
});

describe("[SPEC-TX-R05] límites de captura", () => {
  it("descarta un tercer decimal", () => {
    expect(sanitizeAmountInput("12.345")).toBeNull();
  });

  it("descarta un octavo dígito entero", () => {
    expect(sanitizeAmountInput("12345678")).toBeNull();
    expect(sanitizeAmountInput("1234567")).toBe("1234567");
  });

  it("descarta el pegado de un monto con formato europeo en lugar de truncarlo", () => {
    expect(sanitizeAmountInput("1.234,56")).toBeNull();
  });
});

describe("[SPEC-TX-R06] formato en vivo", () => {
  it.each([
    ["1234567", "1,234,567"],
    ["1234567.8", "1,234,567.8"],
    ["1000", "1,000"],
    ["999", "999"],
    ["0.5", "0.5"],
    ["", ""],
  ])("%p se muestra como %p", (canonical, display) => {
    expect(formatAmountInput(canonical)).toBe(display);
  });

  it("elimina los ceros a la izquierda", () => {
    expect(sanitizeAmountInput("007")).toBe("7");
    expect(sanitizeAmountInput("00")).toBe("0");
    expect(sanitizeAmountInput("00.5")).toBe("0.5");
  });

  it("antepone un cero a un decimal sin parte entera", () => {
    expect(sanitizeAmountInput(".5")).toBe("0.5");
    expect(sanitizeAmountInput(".")).toBe("0.");
  });

  it.each([
    ["1500", "1500.00"],
    ["5.", "5.00"],
    ["5.5", "5.50"],
    ["0.", "0.00"],
    ["12.34", "12.34"],
    ["", ""],
  ])("al salir del campo %p se completa como %p", (canonical, completed) => {
    expect(completeAmountInput(canonical)).toBe(completed);
  });
});
