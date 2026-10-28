"use client";

import { useCallback, type ChangeEvent, type FormEvent } from "react";
import { Alert } from "@/ui/components/Alert/Alert";
import { Button } from "@/ui/components/Button/Button";
import { TextField } from "@/ui/components/TextField/TextField";

export type LoginFormProps = {
  identifier: string;
  fieldError: string | null;
  formError: string | null;
  isSubmitting: boolean;
  onIdentifierChange: (identifier: string) => void;
  onSubmit: () => void;
};

export function LoginForm({
  identifier,
  fieldError,
  formError,
  isSubmitting,
  onIdentifierChange,
  onSubmit,
}: LoginFormProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onIdentifierChange(event.target.value),
    [onIdentifierChange],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit();
    },
    [onSubmit],
  );

  return (
    <form className="flex flex-col gap-4" noValidate aria-label="Iniciar sesión" onSubmit={handleSubmit}>
      <TextField
        label="Teléfono o email"
        name="identifier"
        autoComplete="username"
        placeholder="ana@miniwallet.dev o 55 1234 5678"
        value={identifier}
        error={fieldError}
        readOnly={isSubmitting}
        onChange={handleChange}
      />
      {formError ? <Alert>{formError}</Alert> : null}
      <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
