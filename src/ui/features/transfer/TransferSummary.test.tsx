import { render, screen, within } from "@testing-library/react";
import type { Contact } from "@/domain/models/contact";
import { TransferSummary } from "./TransferSummary";

const MARIANA: Contact = {
  id: "ct_mariana",
  name: "Mariana Soto",
  bank: "BBVA",
  accountType: "CLABE",
  maskedAccount: "•••• 7899",
};

function valueOf(term: string) {
  const termElement = screen.getByText(term, { selector: "dt" });
  return termElement.nextElementSibling;
}

describe("[SPEC-TX-R12] TransferSummary", () => {
  it("muestra monto, destinatario, cuenta enmascarada, concepto y saldo resultante", () => {
    render(
      <TransferSummary
        amountCents={125050}
        contact={MARIANA}
        concept="Renta"
        balanceCents={1245075}
        actions={<button type="button">Editar</button>}
      />,
    );

    expect(screen.getByRole("heading", { name: "Revisa tu transferencia" })).toBeInTheDocument();
    expect(valueOf("Monto a enviar")).toHaveTextContent("$1,250.50");
    expect(valueOf("Para")).toHaveTextContent("Mariana Soto");
    expect(valueOf("Banco")).toHaveTextContent("BBVA");
    expect(valueOf("Cuenta")).toHaveTextContent("CLABE •••• 7899");
    expect(valueOf("Concepto")).toHaveTextContent("Renta");
    expect(valueOf("Saldo disponible")).toHaveTextContent("$12,450.75");
    expect(valueOf("Saldo después de la transferencia")).toHaveTextContent("$11,200.25");
    expect(within(document.body).getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("[SPEC-TX-AC05] sin concepto lo indica y con el saldo completo queda en $0.00", () => {
    render(
      <TransferSummary
        amountCents={1245075}
        contact={MARIANA}
        concept=""
        balanceCents={1245075}
        actions={null}
      />,
    );

    expect(valueOf("Concepto")).toHaveTextContent("Sin concepto");
    expect(valueOf("Saldo después de la transferencia")).toHaveTextContent("$0.00");
  });
});
