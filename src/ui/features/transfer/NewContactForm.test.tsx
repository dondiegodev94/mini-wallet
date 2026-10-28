import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import type { AccountType } from "@/domain/models/contact";
import { NewContactForm, type NewContactFormProps } from "./NewContactForm";

function renderForm(overrides: Partial<NewContactFormProps> = {}) {
  const props: NewContactFormProps = {
    values: { name: "", accountType: "PHONE", account: "", bank: "" },
    fieldErrors: {},
    formError: null,
    isSubmitting: false,
    canCancel: true,
    onNameChange: jest.fn(),
    onAccountTypeChange: jest.fn(),
    onAccountChange: jest.fn(),
    onBankChange: jest.fn(),
    onSubmit: jest.fn(async () => null),
    onCancel: jest.fn(),
    ...overrides,
  };
  render(<NewContactForm {...props} />);
  return props;
}

function AccountHarness({ accountType }: { accountType: AccountType }) {
  const [account, setAccount] = useState("");
  return (
    <NewContactForm
      values={{ name: "", accountType, account, bank: "" }}
      fieldErrors={{}}
      formError={null}
      isSubmitting={false}
      canCancel
      onNameChange={jest.fn()}
      onAccountTypeChange={jest.fn()}
      onAccountChange={setAccount}
      onBankChange={jest.fn()}
      onSubmit={jest.fn()}
      onCancel={jest.fn()}
    />
  );
}

describe("NewContactForm", () => {
  it.each([
    ["PHONE", "Número de celular", "5512345678", "55 1234 5678"],
    ["CARD", "Número de tarjeta", "4915600212345675", "4915 6002 1234 5675"],
    ["CLABE", "Número de CLABE", "012180001234567899", "012 180 0012 3456 7899"],
  ] as const)("[SPEC-CT-AC04] %p usa su máscara", (accountType, label, digits, formatted) => {
    render(<AccountHarness accountType={accountType} />);
    const input = screen.getByLabelText(label);

    fireEvent.change(input, { target: { value: digits } });

    expect(input).toHaveValue(formatted);
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("[SPEC-CT-R11] no admite letras ni más dígitos que el tipo", () => {
    render(<AccountHarness accountType="PHONE" />);
    const input = screen.getByLabelText("Número de celular");

    fireEvent.change(input, { target: { value: "55a" } });
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "55123456789" } });
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "(55) 1234-5678" } });
    expect(input).toHaveValue("55 1234 5678");
  });

  it("[SPEC-CT-R02] el tipo de cuenta se elige con un control de opciones", () => {
    const props = renderForm();

    fireEvent.click(screen.getByRole("radio", { name: "CLABE" }));

    expect(props.onAccountTypeChange).toHaveBeenCalledWith("CLABE");
    expect(screen.getByRole("radio", { name: "Celular" })).toBeChecked();
  });

  it("[SPEC-CT-R05] el banco se elige de un catálogo", () => {
    const props = renderForm();
    const bank = screen.getByLabelText("Banco");

    fireEvent.change(bank, { target: { value: "BBVA" } });

    expect(props.onBankChange).toHaveBeenCalledWith("BBVA");
    expect(screen.getByRole("option", { name: "Mini Wallet" })).toBeInTheDocument();
  });

  it("[SPEC-CT-AC05] lleva el foco al primer campo inválido y muestra los errores", async () => {
    renderForm({
      fieldErrors: { account: "El celular debe tener 10 dígitos." },
      onSubmit: async () => "account",
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "Nuevo contacto" }));
    });

    const account = screen.getByLabelText("Número de celular");
    expect(account).toHaveFocus();
    expect(account).toHaveAccessibleDescription("El celular debe tener 10 dígitos.");
  });

  it("[SPEC-CT-R13] mientras guarda bloquea los campos y el botón", () => {
    renderForm({ isSubmitting: true });

    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    expect(screen.getByLabelText("Nombre")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Banco")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });

  it("[SPEC-CT-AC02] sin contactos no ofrece cancelar el alta", () => {
    renderForm({ canCancel: false });
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });
});
