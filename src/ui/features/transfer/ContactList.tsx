"use client";

import { useCallback } from "react";
import type { Contact } from "@/domain/models/contact";
import { ACCOUNT_TYPE_LABEL } from "./accountTypes";

type ContactListProps = {
  contacts: readonly Contact[];
  selectedId: string | null;
  onSelect: (contact: Contact) => void;
};

type ContactOptionProps = {
  contact: Contact;
  checked: boolean;
  onSelect: (contact: Contact) => void;
};

function ContactOption({ contact, checked, onSelect }: ContactOptionProps) {
  const handleChange = useCallback(() => onSelect(contact), [contact, onSelect]);

  return (
    <label className="group block cursor-pointer">
      <input
        type="radio"
        name="recipient"
        value={contact.id}
        checked={checked}
        onChange={handleChange}
        className="peer sr-only"
      />
      <span className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted peer-checked:border-primary peer-checked:bg-primary/10 peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">{contact.name}</span>
          <span className="truncate text-sm text-muted-foreground">
            {contact.bank} · {ACCOUNT_TYPE_LABEL[contact.accountType]} {contact.maskedAccount}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="size-5 shrink-0 rounded-full border-2 border-border group-has-checked:border-[6px] group-has-checked:border-primary"
        />
      </span>
    </label>
  );
}

export function ContactList({ contacts, selectedId, onSelect }: ContactListProps) {
  return (
    <div role="radiogroup" aria-label="Contactos favoritos" className="flex flex-col gap-2">
      {contacts.map((contact) => (
        <ContactOption
          key={contact.id}
          contact={contact}
          checked={contact.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
