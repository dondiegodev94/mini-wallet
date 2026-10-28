import { formatAmountInput, sanitizeAmountInput } from "@/domain/rules/amount";
import { formatAccountNumber, sanitizeAccountInput } from "@/domain/rules/account";
import { applyMaskedEdit } from "./maskedInput";

function amountEdit(raw: string, caret: number, current: string, inputType = "insertText") {
  return applyMaskedEdit({ raw, caret, inputType }, current, sanitizeAmountInput, formatAmountInput);
}

function phoneEdit(raw: string, caret: number, current: string, inputType = "insertText") {
  return applyMaskedEdit(
    { raw, caret, inputType },
    current,
    (value) => sanitizeAccountInput(value, "PHONE"),
    (value) => formatAccountNumber(value, "PHONE"),
  );
}

describe("[SPEC-TX-R06] cursor del monto", () => {
  it("queda al final al teclear al final aunque se agregue una coma", () => {
    // "1,234" → teclea "5" al final → "12,345"
    expect(amountEdit("1,2345", 6, "1234")).toEqual({ value: "12345", caret: 6 });
  });

  it("queda justo después del dígito insertado en medio", () => {
    // "1,234" con el cursor tras el "1" → teclea "5" → "15,234", cursor tras el "5"
    expect(amountEdit("15,234", 2, "1234")).toEqual({ value: "15234", caret: 2 });
  });

  it("[SPEC-TX-R05] un cambio descartado devuelve el cursor a su lugar", () => {
    // "12.34" con el cursor antes del "4" → teclea "9" → se descarta
    expect(amountEdit("12.394", 5, "12.34")).toEqual({ value: null, caret: 4 });
  });

  it("borrar una coma con Retroceso borra el dígito anterior", () => {
    // "1,234" con el cursor tras la coma → Retroceso quita la coma
    expect(amountEdit("1234", 1, "1234", "deleteContentBackward")).toEqual({
      value: "234",
      caret: 0,
    });
  });

  it("un punto inicial se convierte en 0. con el cursor al final", () => {
    expect(amountEdit(".", 1, "")).toEqual({ value: "0.", caret: 2 });
  });
});

describe("[SPEC-CT-R12] cursor del número de cuenta", () => {
  it("salta el espacio de la máscara al teclear", () => {
    // "55" → teclea "1" → "55 1"
    expect(phoneEdit("551", 3, "55")).toEqual({ value: "551", caret: 4 });
  });

  it("[SPEC-CT-R11] descarta una letra sin mover el cursor", () => {
    expect(phoneEdit("55 a", 4, "55")).toEqual({ value: null, caret: 2 });
  });

  it("borrar el espacio con Retroceso borra el dígito anterior", () => {
    // "55 1" con el cursor tras el espacio → Retroceso quita el espacio
    expect(phoneEdit("551", 2, "551", "deleteContentBackward")).toEqual({ value: "51", caret: 1 });
  });
});
