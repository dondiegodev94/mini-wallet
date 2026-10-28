import type { Metadata } from "next";
import { Suspense } from "react";
import { WalletSkeleton } from "@/ui/features/home/WalletSkeleton";
import { WalletOverview } from "./_components/WalletOverview";

export const metadata: Metadata = {
  title: "Inicio",
};

export default function HomePage() {
  return (
    <Suspense fallback={<WalletSkeleton />}>
      <WalletOverview />
    </Suspense>
  );
}
