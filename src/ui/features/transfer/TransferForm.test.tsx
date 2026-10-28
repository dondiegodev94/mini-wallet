import { fireEvent, render, screen } from "@testing-library/react";
import { TRANSFER_MESSAGES, type TransferField } from "@/domain/rules/transfer";
import { TransferForm, type TransferFormProps } from "./TransferForm";

function renderForm(overrides: Partial<TransferFormProps> = {}) {
  const props: TransferFormProps = {
    balanceCents: 1245075,
    amountInput: "",
    concept: "",
    errors: {},
    recipient: <p>Lista de contactos</p>,
    onAmountChange: jest.fn(),
    onAmountBlur: jest.fn(),
    onConceptChange: jest.fn(),
    onSubmit: jest.fn<TransferField | null, []>(() => null),
    onCancel: jest.fn(),
    ...overrides,
  };
  render(<TransferForm {...props} />);
  return props;
}

function submit() {
  fireEvent.submit(screen.getByRole("form", { name: "Nueva transacción" }));
}

describe("TransferForm", () => {
  it("[SPEC-TX-R12] muestra el saldo disponible junto al monto", () => {
    renderForm({ amountInput: "1500" });

    const amount = screen.getByLabelText("¿Cuánto quieres enviar?");
    expect(amount).toHaveValue("1,500");
    expect(amount).toHaveAccessibleDescription("Saldo disponible: $12,450.75");
  });

  it("[SPEC-TX-R16] lleva el foco al monto cuando es el primer campo inválido", () => {
    renderForm({ onSubmit: () => "amount" });
    submit();
    expect(screen.getByLabelText("¿Cuánto quieres enviar?")).toHaveFocus();
  });

  it("[SPEC-TX-AC06] lleva el foco al destinatario y anuncia su error", () => {
    renderForm({
      onSubmit: () => "contactId",
      errors: { contactId: TRANSFER_MESSAGES.recipientRequired },
    });
    submit();

    const recipient = screen.getByRole("group", { name: "Destinatario" });
    expect(recipient).toHaveFocus();
    expect(recipient).toHaveAccessibleDescription(TRANSFER_MESSAGES.recipientRequired);
  });

  it("[SPEC-TX-R09] el concepto tiene límite de 40 caracteres con contador", () => {
    const props = renderForm({ concept: "Renta" });
    const concept = screen.getByLabelText("Concepto (opcional)");

    expect(concept).toHaveAttribute("maxlength", "40");
    expect(concept).toHaveAccessibleDescription("5/40");

    fireEvent.change(concept, { target: { value: "Renta de noviembre" } });
    expect(props.onConceptChange).toHaveBeenCalledWith("Renta de noviembre");
  });

  it("el monto y el concepto pertenecen al formulario de la transacción", () => {
    renderForm();
    const form = screen.getByRole("form", { name: "Nueva transacción" });

    expect(screen.getByLabelText("¿Cuánto quieres enviar?")).toHaveAttribute("form", form.id);
    expect(screen.getByLabelText("Concepto (opcional)")).toHaveAttribute("form", form.id);
  });

  it("[SPEC-TX-AC10] cancelar notifica sin enviar", () => {
    const props = renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });
});
