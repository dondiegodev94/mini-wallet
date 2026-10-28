"use client";

import { useCallback, useRef, type ChangeEvent, type FormEvent } from "react";
import { BANKS, type AccountType } from "@/domain/models/contact";
import { formatAccountNumber, sanitizeAccountInput } from "@/domain/rules/account";
import { CONTACT_NAME_MAX_LENGTH } from "@/domain/schemas/contact.schema";
import { Alert } from "@/ui/components/Alert/Alert";
import { Button } from "@/ui/components/Button/Button";
import { MaskedField } from "@/ui/components/MaskedField/MaskedField";
import { SegmentedControl } from "@/ui/components/SegmentedControl/SegmentedControl";
import { SelectField } from "@/ui/components/SelectField/SelectField";
import { TextField } from "@/ui/components/TextField/TextField";
import { ACCOUNT_FIELD_LABEL, ACCOUNT_PLACEHOLDER, ACCOUNT_TYPE_OPTIONS } from "./accountTypes";

type NewContactField = "name" | "accountType" | "account" | "bank";

export type NewContactFormProps = {
  values: { name: string; accountType: AccountType; account: string; bank: string };
  fieldErrors: Partial<Record<NewContactField, string>>;
  formError: string | null;
  isSubmitting: boolean;
  canCancel: boolean;
  onNameChange: (name: string) => void;
  onAccountTypeChange: (accountType: AccountType) => void;
  onAccountChange: (account: string) => void;
  onBankChange: (bank: string) => void;
  onSubmit: () => Promise<NewContactField | null>;
  onCancel: () => void;
};

export function NewContactForm({
  values,
  fieldErrors,
  formError,
  isSubmitting,
  canCancel,
  onNameChange,
  onAccountTypeChange,
  onAccountChange,
  onBankChange,
  onSubmit,
  onCancel,
}: NewContactFormProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLInputElement>(null);
  const bankRef = useRef<HTMLSelectElement>(null);
  const { accountType } = values;

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onNameChange(event.target.value),
    [onNameChange],
  );

  const sanitizeAccount = useCallback(
    (raw: string) => sanitizeAccountInput(raw, accountType),
    [accountType],
  );
  const formatAccount = useCallback(
    (digits: string) => formatAccountNumber(digits, accountType),
    [accountType],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const invalidField = await onSubmit();
      if (invalidField === "name") nameRef.current?.focus();
      if (invalidField === "account") accountRef.current?.focus();
      if (invalidField === "bank") bankRef.current?.focus();
    },
    [onSubmit],
  );

  return (
    <form
      aria-label="Nuevo contacto"
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-4"
    >
      <p className="font-semibold text-foreground">Nuevo contacto</p>
      <TextField
        ref={nameRef}
        label="Nombre"
        name="contactName"
        autoComplete="off"
        maxLength={CONTACT_NAME_MAX_LENGTH}
        value={values.name}
        error={fieldErrors.name}
        readOnly={isSubmitting}
        onChange={handleNameChange}
      />
      <SegmentedControl
        legend="Tipo de cuenta"
        name="accountType"
        options={ACCOUNT_TYPE_OPTIONS}
        value={accountType}
        disabled={isSubmitting}
        onValueChange={onAccountTypeChange}
      />
      <MaskedField
        ref={accountRef}
        label={ACCOUNT_FIELD_LABEL[accountType]}
        name="account"
        inputMode="numeric"
        placeholder={ACCOUNT_PLACEHOLDER[accountType]}
        value={values.account}
        sanitize={sanitizeAccount}
        format={formatAccount}
        error={fieldErrors.account}
        readOnly={isSubmitting}
        onValueChange={onAccountChange}
      />
      <SelectField
        ref={bankRef}
        label="Banco"
        name="bank"
        placeholder="Selecciona el banco"
        options={BANKS}
        value={values.bank}
        error={fieldErrors.bank}
        disabled={isSubmitting}
        onValueChange={onBankChange}
      />
      {formError ? <Alert>{formError}</Alert> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {canCancel ? (
          <Button variant="ghost" disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" variant="secondary" isLoading={isSubmitting}>
          {isSubmitting ? "Guardando…" : "Guardar contacto"}
        </Button>
      </div>
    </form>
  );
}
