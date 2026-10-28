import { Card } from "@/ui/components/Card/Card";

export function TransferProcessing() {
  return (
    <Card role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-10 text-center">
      <span
        aria-hidden="true"
        className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
      />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">Procesando tu transferencia</p>
        <p className="text-sm text-muted-foreground">Esto puede tardar unos segundos.</p>
      </div>
    </Card>
  );
}
