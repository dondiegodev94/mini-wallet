import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { completeAmountInput, parseAmountToCents } from "@/domain/rules/amount";
import {
  firstInvalidField,
  validateTransfer,
  type TransferErrors,
  type TransferField,
} from "@/domain/rules/transfer";
import { resetTransferDraft, useTransferStore } from "@/application/store/transferStore";

export const TRANSFER_REVIEW_ROUTE = "/transfer/review";
export const HOME_ROUTE = "/";

export function useTransferForm(balanceCents: number) {
  const router = useRouter();
  const amountInput = useTransferStore((state) => state.amountInput);
  const contact = useTransferStore((state) => state.contact);
  const concept = useTransferStore((state) => state.concept);
  const setAmountInput = useTransferStore((state) => state.setAmountInput);
  const selectContact = useTransferStore((state) => state.selectContact);
  const setConcept = useTransferStore((state) => state.setConcept);
  const prepareReview = useTransferStore((state) => state.prepareReview);

  const [amountTouched, setAmountTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const amountCents = parseAmountToCents(amountInput);
  const errors = validateTransfer(
    { amountCents, contactId: contact?.id ?? null, concept },
    balanceCents,
  );

  const visibleErrors: TransferErrors = {
    amount: submitted || amountTouched ? errors.amount : undefined,
    contactId: submitted ? errors.contactId : undefined,
    concept: errors.concept,
  };

  const blurAmount = useCallback(() => {
    setAmountInput(completeAmountInput(amountInput));
    setAmountTouched(true);
  }, [amountInput, setAmountInput]);

  const submit = useCallback((): TransferField | null => {
    const invalidField = firstInvalidField(errors);
    if (invalidField !== null || amountCents === null || contact === null) {
      setSubmitted(true);
      return invalidField;
    }

    setAmountInput(completeAmountInput(amountInput));
    prepareReview({ amountCents, contact, concept, balanceCents });
    // El estado de la vista se limpia antes de navegar: el Router Cache lo conservaría al volver.
    setSubmitted(false);
    setAmountTouched(false);
    router.push(TRANSFER_REVIEW_ROUTE);
    return null;
  }, [amountCents, amountInput, balanceCents, concept, contact, errors, prepareReview, router, setAmountInput]);

  const cancel = useCallback(() => {
    resetTransferDraft();
    setSubmitted(false);
    setAmountTouched(false);
    router.push(HOME_ROUTE);
  }, [router]);

  return {
    amountInput,
    contact,
    concept,
    errors: visibleErrors,
    setAmountInput,
    blurAmount,
    selectContact,
    setConcept,
    submit,
    cancel,
  };
}
