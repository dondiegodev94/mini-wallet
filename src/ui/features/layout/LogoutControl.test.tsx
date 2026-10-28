import { fireEvent, render, screen } from "@testing-library/react";
import { LogoutControl } from "./LogoutControl";

describe("LogoutControl", () => {
  it("ejecuta el cierre de sesión al activarse", () => {
    const onLogout = jest.fn();
    render(<LogoutControl isPending={false} error={null} onLogout={onLogout} />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("se deshabilita mientras está en curso", () => {
    render(<LogoutControl isPending error={null} onLogout={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeDisabled();
  });

  it("[SPEC-HOME-R10] informa el error si el cierre falla", () => {
    render(<LogoutControl isPending={false} error="No pudimos conectar." onLogout={jest.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos conectar.");
  });
});
