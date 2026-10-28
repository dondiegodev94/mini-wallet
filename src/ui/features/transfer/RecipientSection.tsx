import type { ReactNode } from "react";
import type { Contact } from "@/domain/models/contact";
import { Button } from "@/ui/components/Button/Button";
import { EmptyState } from "@/ui/components/EmptyState/EmptyState";
import { ContactList } from "./ContactList";

type RecipientSectionProps = {
  contacts: readonly Contact[];
  selectedId: string | null;
  isFormOpen: boolean;
  newContactForm: ReactNode;
  onSelect: (contact: Contact) => void;
  onOpenForm: () => void;
};

export function RecipientSection({
  contacts,
  selectedId,
  isFormOpen,
  newContactForm,
  onSelect,
  onOpenForm,
}: RecipientSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {contacts.length > 0 ? (
        <ContactList contacts={contacts} selectedId={selectedId} onSelect={onSelect} />
      ) : (
        <EmptyState
          title="Aún no tienes contactos guardados"
          description="Agrega uno para enviarle dinero; quedará en tus favoritos."
        />
      )}
      {isFormOpen ? (
        newContactForm
      ) : (
        <Button variant="secondary" onClick={onOpenForm}>
          Nuevo contacto
        </Button>
      )}
    </div>
  );
}
