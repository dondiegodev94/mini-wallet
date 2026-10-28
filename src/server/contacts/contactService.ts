import "server-only";
import type { Contact } from "@/domain/models/contact";
import { maskAccount } from "@/domain/rules/account";
import { sortContactsByName } from "@/domain/rules/contacts";
import type { NewContact } from "@/domain/schemas/contact.schema";
import { simulateLatency } from "@/server/mock/latency";
import { contactRepository, type StoredContact } from "./contactRepository";

export const CONTACTS_LATENCY_MS = 400;

export type CreateContactResult = { ok: true; contact: Contact } | { ok: false; reason: "DUPLICATE" };

function toPublicContact({ id, name, bank, accountType, account }: StoredContact): Contact {
  return { id, name, bank, accountType, maskedAccount: maskAccount(account) };
}

export async function listContacts(userId: string): Promise<Contact[]> {
  await simulateLatency(CONTACTS_LATENCY_MS);
  return sortContactsByName(contactRepository.listByUserId(userId)).map(toPublicContact);
}

export async function createContact(userId: string, input: NewContact): Promise<CreateContactResult> {
  await simulateLatency(CONTACTS_LATENCY_MS);

  // Verificación e inserción sin `await` intermedio: dos altas simultáneas no pueden duplicarse.
  if (contactRepository.findByAccount(userId, input.accountType, input.account)) {
    return { ok: false, reason: "DUPLICATE" };
  }
  return { ok: true, contact: toPublicContact(contactRepository.insert({ userId, ...input })) };
}
