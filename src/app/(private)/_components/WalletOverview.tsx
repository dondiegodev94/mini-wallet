import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/currentSession";
import { readMockScenario } from "@/server/mock/scenarios";
import { getWalletSummary } from "@/server/wallet/walletService";
import { ButtonLink } from "@/ui/components/ButtonLink/ButtonLink";
import { WalletDashboard } from "@/ui/features/home/WalletDashboard";

const LOGIN_ROUTE = "/login";
const TRANSFER_ROUTE = "/transfer";

export async function WalletOverview() {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_ROUTE);

  const summary = await getWalletSummary(session.userId, {
    scenario: readMockScenario(await headers()),
  });
  if (!summary) redirect(LOGIN_ROUTE);

  return (
    <WalletDashboard
      summary={summary}
      transferAction={
        <ButtonLink href={TRANSFER_ROUTE} size="lg" fullWidth>
          Nueva transacción
        </ButtonLink>
      }
    />
  );
}
