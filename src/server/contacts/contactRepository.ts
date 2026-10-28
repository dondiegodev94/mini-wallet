import "server-only";
import { randomUUID } from "node:crypto";
import type { AccountType, Bank } from "@/domain/models/contact";

export type StoredContact = {
  id: string;
  userId: string;
  name: string;
  bank: Bank;
  accountType: AccountType;
  account: string;
};

const SEED_CONTACTS: readonly StoredContact[] = [
  { id: "ct_carlos", userId: "usr_ana", name: "Carlos Núñez", bank: "Banorte", accountType: "CARD", account: "4915600212345675" },
  { id: "ct_luis", userId: "usr_ana", name: "Luis Pérez", bank: "Mini Wallet", accountType: "PHONE", account: "5587654321" },
  { id: "ct_mariana", userId: "usr_ana", name: "Mariana Soto", bank: "BBVA", accountType: "CLABE", account: "012180001234567899" },
];

type ContactStore = { contacts: StoredContact[] };

// En globalThis para que todas las API Routes (y el recargado en caliente) compartan el mismo estado.
const globalForContacts = globalThis as typeof globalThis & { miniWalletContacts?: ContactStore };

function getStore(): ContactStore {
  globalForContacts.miniWalletContacts ??= { contacts: [...SEED_CONTACTS] };
  return globalForContacts.miniWalletContacts;
}

export const contactRepository = {
  listByUserId(userId: string): StoredContact[] {
    return getStore().contacts.filter((contact) => contact.userId === userId);
  },

  findByAccount(userId: string, accountType: AccountType, account: string): StoredContact | undefined {
    return getStore().contacts.find(
      (contact) =>
        contact.userId === userId && contact.accountType === accountType && contact.account === account,
    );
  },

  insert(contact: Omit<StoredContact, "id">): StoredContact {
    const stored = { ...contact, id: `ct_${randomUUID().slice(0, 8)}` };
    getStore().contacts.push(stored);
    return stored;
  },

  reset(): void {
    globalForContacts.miniWalletContacts = { contacts: [...SEED_CONTACTS] };
  },
};
