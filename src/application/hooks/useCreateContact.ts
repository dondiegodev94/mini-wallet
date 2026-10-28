import { useCallback, useRef, useState } from "react";
import { z } from "zod";
import { contactCreatedResponseSchema } from "@/domain/contracts/contacts";
import type { AccountType, Contact } from "@/domain/models/contact";
import { contactInputSchema } from "@/domain/schemas/contact.schema";
import { requestJson } from "@/application/http/requestJson";
import { requestErrorMessage } from "@/application/http/requestErrorMessage";

export const CONTACTS_ENDPOINT = "/api/contacts";

export const CONTACT_FIELDS = ["name", "accountType", "account", "bank"] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];
export type ContactFieldErrors = Partial<Record<ContactField, string>>;

export type ContactFormValues = {
  name: string;
  accountType: AccountType;
  account: string;
  bank: string;
};

const INITIAL_VALUES: ContactFormValues = {
  name: "",
  accountType: "PHONE",
  account: "",
  bank: "",
};

function firstMessages(fieldErrors: Record<string, string[] | undefined>): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  for (const field of CONTACT_FIELDS) {
    const message = fieldErrors[field]?.[0];
    if (message) errors[field] = message;
  }
  return errors;
}

function firstErrorField(errors: ContactFieldErrors): ContactField | null {
  return CONTACT_FIELDS.find((field) => errors[field] !== undefined) ?? null;
}

export function useCreateContact(onCreated: (contact: Contact) => void) {
  const [values, setValues] = useState<ContactFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inFlight = useRef(false);

  const updateField = useCallback(
    <K extends keyof ContactFormValues>(field: K, value: ContactFormValues[K]) => {
      setValues((previous) => ({ ...previous, [field]: value }));
      setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
      setFormError(null);
    },
    [],
  );

  const setName = useCallback((name: string) => updateField("name", name), [updateField]);
  const setAccount = useCallback((account: string) => updateField("account", account), [updateField]);
  const setBank = useCallback((bank: string) => updateField("bank", bank), [updateField]);

  const setAccountType = useCallback((accountType: AccountType) => {
    // Un número capturado no tiene sentido con otra máscara: cambiar el tipo lo vacía.
    setValues((previous) => ({ ...previous, accountType, account: "" }));
    setFieldErrors((previous) => ({ ...previous, accountType: undefined, account: undefined }));
    setFormError(null);
  }, []);

  const reset = useCallback(() => {
    inFlight.current = false;
    setValues(INITIAL_VALUES);
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(false);
  }, []);

  const submit = useCallback(async (): Promise<ContactField | null> => {
    if (inFlight.current) return null;

    const parsed = contactInputSchema.safeParse(values);
    if (!parsed.success) {
      const errors = firstMessages(z.flattenError(parsed.error).fieldErrors);
      setFieldErrors(errors);
      setFormError(null);
      return firstErrorField(errors);
    }

    inFlight.current = true;
    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const result = await requestJson(CONTACTS_ENDPOINT, {
      method: "POST",
      body: parsed.data,
      schema: contactCreatedResponseSchema,
    });

    if (result.ok) {
      // Se limpia antes de notificar: quien recibe el contacto puede desmontar este formulario.
      reset();
      onCreated(result.data.contact);
      return null;
    }

    inFlight.current = false;
    setIsSubmitting(false);
    const serverErrors =
      result.kind === "http" && result.error?.fieldErrors ? firstMessages(result.error.fieldErrors) : {};
    const field = firstErrorField(serverErrors);
    if (field) {
      setFieldErrors(serverErrors);
      return field;
    }
    setFormError(requestErrorMessage(result));
    return null;
  }, [onCreated, reset, values]);

  return {
    values,
    fieldErrors,
    formError,
    isSubmitting,
    setName,
    setAccountType,
    setAccount,
    setBank,
    submit,
    reset,
  };
}
