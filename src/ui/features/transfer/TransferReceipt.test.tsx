import { render, screen, within } from "@testing-library/react";
import type { Transaction } from "@/domain/models/transaction";
import { TransferReceipt } from "./TransferReceipt";

const TRANSACTION: Transaction = {
  id: "tx_1",
  reference: "MW48213907",
  amountCents: 125050,
  concept: "Renta",
  createdAt: "2026-10-28T18:42:10.000Z",
  recipient: { name: "Mariana Soto", bank: "BBVA", accountType: "CLABE", maskedAccount: "•••• 7899" },
  balanceAfterCents: 1120025,
};

function valueOf(term: string) {
  const row = screen.getByText(term, { selector: "dt" }).parentElement;
  if (!row) throw new Error(`No existe la fila ${term}`);
  return within(row).getByRole("definition").textContent;
}

describe("TransferReceipt", () => {
  it("[SPEC-CONF-R21] muestra folio, fecha, monto, destinatario, concepto y saldo resultante", () => {
    render(<TransferReceipt transaction={TRANSACTION} actions={<button type="button">Volver al inicio</button>} />);

    expect(valueOf("Monto enviado")).toBe("$1,250.50");
    expect(valueOf("Para")).toBe("Mariana Soto");
    expect(valueOf("Banco")).toBe("BBVA");
    expect(valueOf("Cuenta")).toBe("CLABE •••• 7899");
    expect(valueOf("Concepto")).toBe("Renta");
    expect(valueOf("Folio")).toBe("MW48213907");
    expect(valueOf("Fecha y hora")).toMatch(/28 oct 2026.*12:42/);
    expect(valueOf("Saldo disponible")).toBe("$11,200.25");
    expect(screen.getByRole("button", { name: "Volver al inicio" })).toBeInTheDocument();
  });

  it("[SPEC-CONF-R23] mueve el foco al título", () => {
    render(<TransferReceipt transaction={TRANSACTION} actions={null} />);
    expect(screen.getByRole("heading", { name: "Transferencia enviada" })).toHaveFocus();
  });
});
