import { render, screen, within } from "@testing-library/react";
import type { Movement, WalletSummary } from "@/domain/models/wallet";
import { WalletDashboard } from "./WalletDashboard";
import { WalletSkeleton } from "./WalletSkeleton";

const movements: Movement[] = [
  {
    id: "mov_2",
    type: "CREDIT",
    amountCents: 120000,
    counterparty: "Carlos Núñez",
    concept: "Venta de bicicleta",
    occurredAt: "2026-10-24T21:15:00.000Z",
  },
  {
    id: "mov_1",
    type: "DEBIT",
    amountCents: 35000,
    counterparty: "Luis Pérez",
    concept: "Cena",
    occurredAt: "2026-10-26T02:15:00.000Z",
  },
];

function renderDashboard(overrides: Partial<WalletSummary> = {}) {
  const summary: WalletSummary = {
    user: { id: "usr_ana", name: "Ana García" },
    balanceCents: 1245075,
    movements,
    ...overrides,
  };
  render(<WalletDashboard summary={summary} transferAction={<a href="/transfer">Nueva transacción</a>} />);
}

describe("WalletDashboard", () => {
  it("[SPEC-HOME-AC01] saluda por el nombre y muestra el saldo con formato", () => {
    renderDashboard();

    expect(screen.getByRole("heading", { level: 1, name: "Hola, Ana" })).toBeInTheDocument();
    expect(screen.getByRole("definition")).toHaveTextContent("$12,450.75");
    expect(screen.getByRole("term")).toHaveTextContent("Saldo disponible");
  });

  it("[SPEC-HOME-AC06] muestra la acción de nueva transacción", () => {
    renderDashboard();
    expect(screen.getByRole("link", { name: "Nueva transacción" })).toHaveAttribute("href", "/transfer");
  });

  it("[SPEC-HOME-AC02] lista los movimientos en el orden recibido", () => {
    renderDashboard();
    const items = within(screen.getByRole("list", { name: "Movimientos recientes" })).getAllByRole("listitem");

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Carlos Núñez");
    expect(items[1]).toHaveTextContent("Luis Pérez");
  });

  it("[SPEC-HOME-R03] comunica el tipo con signo y con texto accesible", () => {
    renderDashboard();
    const [credit, debit] = within(screen.getByRole("list")).getAllByRole("listitem");

    expect(credit).toHaveTextContent("Abono: +$1,200.00");
    expect(debit).toHaveTextContent("Cargo: -$350.00");
  });

  it("[SPEC-HOME-R06] muestra la fecha en la zona horaria de CDMX", () => {
    renderDashboard();
    expect(screen.getByText("25 oct 2026, 20:15")).toHaveAttribute("dateTime", "2026-10-26T02:15:00.000Z");
  });

  it("[SPEC-HOME-AC03] sin movimientos muestra el estado vacío y conserva el saldo", () => {
    renderDashboard({ movements: [], balanceCents: 0 });

    expect(screen.getByText("Aún no tienes movimientos")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByRole("definition")).toHaveTextContent("$0.00");
    expect(screen.getByRole("link", { name: "Nueva transacción" })).toBeInTheDocument();
  });
});

describe("WalletSkeleton", () => {
  it("[SPEC-HOME-AC04] anuncia la carga a lectores de pantalla", () => {
    render(<WalletSkeleton />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando tu información");
  });
});
