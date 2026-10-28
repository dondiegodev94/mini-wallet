"use client";

import { useEffect } from "react";
import { Button } from "@/ui/components/Button/Button";
import { ErrorState } from "@/ui/components/ErrorState/ErrorState";

type PrivateErrorProps = {
  error: unknown;
  retry: () => void;
};

export default function PrivateError({ error, retry }: PrivateErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="No pudimos cargar tu información"
      description="Revisa tu conexión e inténtalo de nuevo en unos momentos."
      action={<Button onClick={retry}>Reintentar</Button>}
    />
  );
}
