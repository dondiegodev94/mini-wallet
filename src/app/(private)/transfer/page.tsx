import type { Metadata } from "next";
import { Suspense } from "react";
import { TransferSkeleton } from "@/ui/features/transfer/TransferSkeleton";
import { TransferSetup } from "./_components/TransferSetup";

export const metadata: Metadata = {
  title: "Nueva transacción",
};

export default function TransferPage() {
  return (
    <Suspense fallback={<TransferSkeleton />}>
      <TransferSetup />
    </Suspense>
  );
}
