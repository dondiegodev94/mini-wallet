import type { Metadata } from "next";
import { StatusScreen } from "./_components/StatusScreen";

export const metadata: Metadata = {
  title: "Estado de tu transferencia",
};

export default function TransferStatusPage() {
  return <StatusScreen />;
}
