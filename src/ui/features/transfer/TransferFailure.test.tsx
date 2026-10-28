import { render, screen } from "@testing-library/react";
import { TRANSFER_FAILURE_COPY, TransferFailure, type TransferFailureStatus } from "./TransferFailure";

const STATUSES = Object.keys(TRANSFER_FAILURE_COPY) as TransferFailureStatus[];

describe("TransferFailure", () => {
  it.each(STATUSES)("[SPEC-CONF-R19][SPEC-CONF-R23] %s se anuncia como alerta y enfoca su título", (status) => {
    render(<TransferFailure status={status} actions={null} />);
    const { title, description } = TRANSFER_FAILURE_COPY[status];

    expect(screen.getByRole("alert")).toHaveTextContent(description);
    expect(screen.getByRole("heading", { name: title })).toHaveFocus();
  });

  it("[SPEC-CONF-R19] el timeout explica que reintentar no cobra dos veces", () => {
    render(<TransferFailure status="TIMEOUT" actions={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent("no se te cobrará dos veces");
  });

  it("[SPEC-CONF-R19] fondos insuficientes aclara que no hubo cargo", () => {
    render(<TransferFailure status="INSUFFICIENT_FUNDS" actions={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se realizó ningún cargo.");
  });
});
