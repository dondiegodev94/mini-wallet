import type { Metadata } from "next";
import { ReviewScreen } from "./_components/ReviewScreen";

export const metadata: Metadata = {
  title: "Revisa tu transferencia",
};

export default function TransferReviewPage() {
  return <ReviewScreen />;
}
