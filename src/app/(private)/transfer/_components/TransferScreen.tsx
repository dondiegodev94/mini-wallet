"use client";

import { useCallback } from "react";
import type { Contact } from "@/domain/models/contact";
import { useCreateContact } from "@/application/hooks/useCreateContact";
import { useRecipientPicker } from "@/application/hooks/useRecipientPicker";
import { useTransferForm } from "@/application/hooks/useTransferForm";
import { NewContactForm } from "@/ui/features/transfer/NewContactForm";
import { RecipientSection } from "@/ui/features/transfer/RecipientSection";
import { TransferForm } from "@/ui/features/transfer/TransferForm";

type TransferScreenProps = {
  balanceCents: number;
  contacts: Contact[];
};

export function TransferScreen({ balanceCents, contacts: initialContacts }: TransferScreenProps) {
  const transfer = useTransferForm(balanceCents);
  const picker = useRecipientPicker(initialContacts, transfer.selectContact);
  const newContact = useCreateContact(picker.addContact);

  const { reset: resetNewContact } = newContact;
  const { closeForm } = picker;
  const cancelNewContact = useCallback(() => {
    resetNewContact();
    closeForm();
  }, [closeForm, resetNewContact]);

  return (
    <TransferForm
      balanceCents={balanceCents}
      amountInput={transfer.amountInput}
      concept={transfer.concept}
      errors={transfer.errors}
      onAmountChange={transfer.setAmountInput}
      onAmountBlur={transfer.blurAmount}
      onConceptChange={transfer.setConcept}
      onSubmit={transfer.submit}
      onCancel={transfer.cancel}
      recipient={
        <RecipientSection
          contacts={picker.contacts}
          selectedId={transfer.contact?.id ?? null}
          isFormOpen={picker.isFormOpen}
          onSelect={transfer.selectContact}
          onOpenForm={picker.openForm}
          newContactForm={
            <NewContactForm
              values={newContact.values}
              fieldErrors={newContact.fieldErrors}
              formError={newContact.formError}
              isSubmitting={newContact.isSubmitting}
              canCancel={picker.canCloseForm}
              onNameChange={newContact.setName}
              onAccountTypeChange={newContact.setAccountType}
              onAccountChange={newContact.setAccount}
              onBankChange={newContact.setBank}
              onSubmit={newContact.submit}
              onCancel={cancelNewContact}
            />
          }
        />
      }
    />
  );
}
