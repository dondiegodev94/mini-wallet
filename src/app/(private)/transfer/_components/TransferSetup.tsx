import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/currentSession";
import { listContacts } from "@/server/contacts/contactService";
import { readMockScenario } from "@/server/mock/scenarios";
import { getWalletSummary } from "@/server/wallet/walletService";
import { TransferScreen } from "./TransferScreen";

const LOGIN_ROUTE = "/login";

export async function TransferSetup() {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_ROUTE);

  const [summary, contacts] = await Promise.all([
    getWalletSummary(session.userId, { scenario: readMockScenario(await headers()) }),
    listContacts(session.userId),
  ]);
  if (!summary) redirect(LOGIN_ROUTE);

  return <TransferScreen balanceCents={summary.balanceCents} contacts={contacts} />;
}
