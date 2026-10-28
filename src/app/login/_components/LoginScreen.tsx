"use client";

import { useLoginFlow } from "@/application/hooks/useLoginFlow";
import { LoginForm } from "@/ui/features/auth/LoginForm";

export function LoginScreen() {
  const { identifier, fieldError, formError, isSubmitting, setIdentifier, submit } = useLoginFlow();

  return (
    <LoginForm
      identifier={identifier}
      fieldError={fieldError}
      formError={formError}
      isSubmitting={isSubmitting}
      onIdentifierChange={setIdentifier}
      onSubmit={submit}
    />
  );
}
