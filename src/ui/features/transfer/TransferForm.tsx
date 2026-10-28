"use client";

import { useCallback, useId, useRef, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { formatAmountInput, sanitizeAmountInput } from "@/domain/rules/amount";
import { formatMoney } from "@/domain/rules/money";
import {
  CONCEPT_MAX_LENGTH,
  type TransferErrors,
  type TransferField,
} from "@/domain/rules/transfer";
import { Button } from "@/ui/components/Button/Button";
import { Card } from "@/ui/components/Card/Card";
import { MaskedField } from "@/ui/components/MaskedField/MaskedField";
import { TextField } from "@/ui/components/TextField/TextField";

export type TransferFormProps = {
  balanceCents: number;
  amountInput: string;
  concept: string;
  errors: TransferErrors;
  recipient: ReactNode;
  onAmountChange: (amountInput: string) => void;
  onAmountBlur: () => void;
  onConceptChange: (concept: string) => void;
  onSubmit: () => TransferField | null;
  onCancel: () => void;
};

export function TransferForm({
  balanceCents,
  amountInput,
  concept,
  errors,
  recipient,
  onAmountChange,
  onAmountBlur,
  onConceptChange,
  onSubmit,
  onCancel,
}: TransferFormProps) {
  const formId = useId();
  const recipientTitleId = useId();
  const recipientErrorId = useId();
  const amountRef = useRef<HTMLInputElement>(null);
  const recipientRef = useRef<HTMLDivElement>(null);
  const conceptRef = useRef<HTMLInputElement>(null);

  const handleConceptChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onConceptChange(event.target.value),
    [onConceptChange],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const invalidField = onSubmit();
      if (invalidField === "amount") amountRef.current?.focus();
      if (invalidField === "contactId") recipientRef.current?.focus();
      if (invalidField === "concept") conceptRef.current?.focus();
    },
    [onSubmit],
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-foreground">Nueva transacción</h1>

      <Card>
        <MaskedField
          ref={amountRef}
          form={formId}
          label="¿Cuánto quieres enviar?"
          name="amount"
          inputMode="decimal"
          size="lg"
          prefix="$"
          suffix="MXN"
          placeholder="0.00"
          value={amountInput}
          sanitize={sanitizeAmountInput}
          format={formatAmountInput}
          error={errors.amount}
          hint={`Saldo disponible: ${formatMoney(balanceCents)}`}
          onValueChange={onAmountChange}
          onBlur={onAmountBlur}
        />
      </Card>

      <Card
        ref={recipientRef}
        role="group"
        tabIndex={-1}
        aria-labelledby={recipientTitleId}
        aria-describedby={errors.contactId ? recipientErrorId : undefined}
        className="flex flex-col gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
      >
        <h2 id={recipientTitleId} className="text-lg font-semibold text-foreground">
          Destinatario
        </h2>
        {errors.contactId ? (
          <p id={recipientErrorId} className="text-sm text-destructive">
            {errors.contactId}
          </p>
        ) : null}
        {recipient}
      </Card>

      <Card>
        <TextField
          ref={conceptRef}
          form={formId}
          label="Concepto (opcional)"
          name="concept"
          autoComplete="off"
          placeholder="Ej. Renta, cena, regalo"
          maxLength={CONCEPT_MAX_LENGTH}
          value={concept}
          error={errors.concept}
          hint={`${concept.length}/${CONCEPT_MAX_LENGTH}`}
          onChange={handleConceptChange}
        />
      </Card>

      <form
        id={formId}
        aria-label="Nueva transacción"
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-2"
      >
        <Button type="submit" size="lg" fullWidth>
          Continuar
        </Button>
        <Button variant="ghost" size="lg" fullWidth onClick={onCancel}>
          Cancelar
        </Button>
      </form>
    </div>
  );
}
