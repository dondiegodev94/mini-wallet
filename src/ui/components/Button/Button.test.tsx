import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("es de tipo button por defecto para no enviar formularios accidentalmente", () => {
    render(<Button>Continuar</Button>);
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveAttribute("type", "button");
  });

  it("ejecuta onClick cuando está habilitado", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Continuar</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("en carga se deshabilita, se marca como ocupado y no ejecuta onClick", () => {
    const onClick = jest.fn();
    render(
      <Button isLoading onClick={onClick}>
        Continuar
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Continuar" });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(onClick).not.toHaveBeenCalled();
  });
});
