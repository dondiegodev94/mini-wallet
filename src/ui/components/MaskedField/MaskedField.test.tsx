import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { formatAmountInput, sanitizeAmountInput } from "@/domain/rules/amount";
import { MaskedField } from "./MaskedField";

function AmountHarness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <MaskedField
      label="Monto"
      inputMode="decimal"
      prefix="$"
      value={value}
      sanitize={sanitizeAmountInput}
      format={formatAmountInput}
      hint="Saldo disponible: $100.00"
      onValueChange={setValue}
    />
  );
}

function amountInput() {
  return screen.getByLabelText("Monto");
}

describe("MaskedField", () => {
  it("[SPEC-TX-R06] muestra el valor con separadores de miles", () => {
    render(<AmountHarness />);

    fireEvent.change(amountInput(), { target: { value: "1234567.8" } });

    expect(amountInput()).toHaveValue("1,234,567.8");
  });

  it("[SPEC-TX-R04][SPEC-TX-R05] descarta un cambio inválido y conserva el valor", () => {
    render(<AmountHarness initial="12.34" />);

    for (const value of ["12.34a", "-12.34", "12.345", "1.234,56"]) {
      fireEvent.change(amountInput(), { target: { value } });
      expect(amountInput()).toHaveValue("12.34");
    }
  });

  it("[SPEC-TX-AC13] usa teclado decimal y enlaza la ayuda y el error", () => {
    render(
      <MaskedField
        label="Monto"
        inputMode="decimal"
        value=""
        sanitize={sanitizeAmountInput}
        format={formatAmountInput}
        hint="Saldo disponible"
        error="Ingresa un monto."
        onValueChange={jest.fn()}
      />,
    );
    const input = amountInput();

    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Saldo disponible Ingresa un monto.");
  });
});
