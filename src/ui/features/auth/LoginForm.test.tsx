import { fireEvent, render, screen } from "@testing-library/react";
import { LoginForm, type LoginFormProps } from "./LoginForm";

function renderForm(overrides: Partial<LoginFormProps> = {}) {
  const props: LoginFormProps = {
    identifier: "",
    fieldError: null,
    formError: null,
    isSubmitting: false,
    onIdentifierChange: jest.fn(),
    onSubmit: jest.fn(),
    ...overrides,
  };
  render(<LoginForm {...props} />);
  return props;
}

describe("LoginForm", () => {
  it("notifica cada cambio del campo con su valor", () => {
    const props = renderForm();

    fireEvent.change(screen.getByLabelText("Teléfono o email"), {
      target: { value: "ana@miniwallet.dev" },
    });

    expect(props.onIdentifierChange).toHaveBeenCalledWith("ana@miniwallet.dev");
  });

  it("envía el formulario sin recargar la página", () => {
    const props = renderForm({ identifier: "ana@miniwallet.dev" });

    const notPrevented = fireEvent.submit(screen.getByRole("form", { name: "Iniciar sesión" }));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(notPrevented).toBe(false);
  });

  it("[SPEC-AUTH-AC02] muestra el error de campo enlazado de forma accesible", () => {
    renderForm({ fieldError: "Ingresa tu teléfono o email." });
    const input = screen.getByLabelText("Teléfono o email");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Ingresa tu teléfono o email.");
  });

  it("[SPEC-AUTH-AC04] muestra el error del servidor como alerta", () => {
    renderForm({ formError: "No encontramos una cuenta con esos datos." });

    expect(screen.getByRole("alert")).toHaveTextContent("No encontramos una cuenta con esos datos.");
  });

  it("no muestra alertas ni errores en el estado inicial", () => {
    renderForm();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono o email")).not.toHaveAttribute("aria-invalid");
  });

  it("[SPEC-AUTH-R12] en carga bloquea el botón y el campo", () => {
    renderForm({ identifier: "ana@miniwallet.dev", isSubmitting: true });

    expect(screen.getByRole("button", { name: "Ingresando…" })).toBeDisabled();
    expect(screen.getByLabelText("Teléfono o email")).toHaveAttribute("readonly");
  });
});
