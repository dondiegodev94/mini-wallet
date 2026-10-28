import { Card } from "@/ui/components/Card/Card";
import { Skeleton } from "@/ui/components/Skeleton/Skeleton";

const PLACEHOLDER_CONTACTS = ["contact-1", "contact-2", "contact-3"];

export function TransferSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Cargando tu información</span>
      <Skeleton className="h-7 w-48" />
      <Card className="flex flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-4 w-48" />
      </Card>
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        {PLACEHOLDER_CONTACTS.map((row) => (
          <Skeleton key={row} className="h-16 w-full rounded-lg" />
        ))}
      </Card>
    </div>
  );
}
