import { Card } from "@/ui/components/Card/Card";
import { Skeleton } from "@/ui/components/Skeleton/Skeleton";

const PLACEHOLDER_ROWS = ["row-1", "row-2", "row-3", "row-4"];

export function WalletSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Cargando tu información</span>
      <Card className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
      </Card>
      <Card className="flex flex-col gap-4">
        <Skeleton className="h-6 w-44" />
        {PLACEHOLDER_ROWS.map((row) => (
          <div key={row} className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}
