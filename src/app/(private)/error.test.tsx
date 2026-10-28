import { fireEvent, render, screen } from "@testing-library/react";
import PrivateError from "./error";

describe("[SPEC-HOME-AC05] estado de error de las páginas privadas", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("muestra el mensaje y no ofrece iniciar una transacción", () => {
    render(<PrivateError error={new Error("boom")} retry={jest.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar tu información");
    expect(screen.queryByText("Nueva transacción")).not.toBeInTheDocument();
  });

  it("al reintentar vuelve a solicitar los datos", () => {
    const retry = jest.fn();
    render(<PrivateError error={new Error("boom")} retry={retry} />);

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
