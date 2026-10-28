import type { Contact } from "@/domain/models/contact";

const nameCollator = new Intl.Collator("es-MX", { sensitivity: "base" });

export function sortContactsByName<T extends Pick<Contact, "name">>(contacts: readonly T[]): T[] {
  return [...contacts].sort((a, b) => nameCollator.compare(a.name, b.name));
}

export function mergeContacts(base: readonly Contact[], added: readonly Contact[]): Contact[] {
  const byId = new Map(base.map((contact) => [contact.id, contact]));
  for (const contact of added) byId.set(contact.id, contact);
  return sortContactsByName([...byId.values()]);
}
