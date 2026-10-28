import "server-only";
import type { Movement } from "@/domain/models/wallet";

type WalletAccount = {
  balanceCents: number;
  movements: Movement[];
};

const SEED_ACCOUNTS: Record<string, WalletAccount> = {
  usr_ana: {
    balanceCents: 1245075,
    movements: [
      { id: "mov_001", type: "CREDIT", amountCents: 2500000, counterparty: "Nómina Acme S.A.", concept: "Pago de nómina", occurredAt: "2026-10-01T15:00:00.000Z" },
      { id: "mov_002", type: "DEBIT", amountCents: 89900, counterparty: "Supermercado La Hoja", concept: "Despensa", occurredAt: "2026-10-03T23:40:00.000Z" },
      { id: "mov_003", type: "DEBIT", amountCents: 45000, counterparty: "Luis Pérez", concept: "Boletos de cine", occurredAt: "2026-10-05T18:20:00.000Z" },
      { id: "mov_004", type: "DEBIT", amountCents: 120000, counterparty: "CFE", concept: "Pago de luz", occurredAt: "2026-10-08T16:05:00.000Z" },
      { id: "mov_005", type: "CREDIT", amountCents: 30000, counterparty: "Luis Pérez", concept: "Mitad del regalo", occurredAt: "2026-10-10T20:10:00.000Z" },
      { id: "mov_006", type: "DEBIT", amountCents: 65050, counterparty: "Gasolinera Ruta 9", concept: "Gasolina", occurredAt: "2026-10-12T13:45:00.000Z" },
      { id: "mov_007", type: "DEBIT", amountCents: 1500000, counterparty: "Inmobiliaria Centro", concept: "Renta de octubre", occurredAt: "2026-10-15T17:00:00.000Z" },
      { id: "mov_008", type: "CREDIT", amountCents: 250000, counterparty: "Mariana Soto", concept: "Pago de préstamo", occurredAt: "2026-10-18T19:30:00.000Z" },
      { id: "mov_009", type: "DEBIT", amountCents: 19900, counterparty: "Streamly", concept: "Suscripción mensual", occurredAt: "2026-10-20T08:00:00.000Z" },
      { id: "mov_010", type: "DEBIT", amountCents: 50, counterparty: "Mini Wallet", concept: "Comisión", occurredAt: "2026-10-22T12:00:00.000Z" },
      { id: "mov_011", type: "CREDIT", amountCents: 120000, counterparty: "Carlos Núñez", concept: "Venta de bicicleta", occurredAt: "2026-10-24T21:15:00.000Z" },
      { id: "mov_012", type: "DEBIT", amountCents: 35000, counterparty: "Luis Pérez", concept: "Cena", occurredAt: "2026-10-26T02:15:00.000Z" },
    ],
  },
  usr_luis: {
    balanceCents: 300000,
    movements: [],
  },
};

export const walletRepository = {
  async findByUserId(userId: string): Promise<WalletAccount | undefined> {
    const account = SEED_ACCOUNTS[userId];
    return account ? { balanceCents: account.balanceCents, movements: [...account.movements] } : undefined;
  },
};
