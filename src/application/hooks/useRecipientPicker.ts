import { useCallback, useMemo, useState } from "react";
import type { Contact } from "@/domain/models/contact";
import { mergeContacts } from "@/domain/rules/contacts";

export function useRecipientPicker(initialContacts: readonly Contact[], onSelect: (contact: Contact) => void) {
  const [addedContacts, setAddedContacts] = useState<Contact[]>([]);
  const [isFormRequested, setIsFormRequested] = useState(false);

  const contacts = useMemo(
    () => mergeContacts(initialContacts, addedContacts),
    [addedContacts, initialContacts],
  );
  const hasContacts = contacts.length > 0;

  const openForm = useCallback(() => setIsFormRequested(true), []);
  const closeForm = useCallback(() => setIsFormRequested(false), []);

  const addContact = useCallback(
    (contact: Contact) => {
      setAddedContacts((previous) => [...previous, contact]);
      setIsFormRequested(false);
      onSelect(contact);
    },
    [onSelect],
  );

  return {
    contacts,
    // Sin contactos, el alta es la única forma de elegir destinatario: el formulario no se puede cerrar.
    isFormOpen: isFormRequested || !hasContacts,
    canCloseForm: hasContacts,
    openForm,
    closeForm,
    addContact,
  };
}
