import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { contactRepository } from "@/server/contacts/contactRepository";
import { userRepository } from "@/server/users/userRepository";
import { walletRepository } from "@/server/wallet/walletRepository";

export const TEST_ACCOUNT_TEMPLATES = ["ana", "luis"] as const;

export type TestAccountTemplate = (typeof TEST_ACCOUNT_TEMPLATES)[number];

const TEMPLATE_USER_ID: Record<TestAccountTemplate, string> = {
  ana: "usr_ana",
  luis: "usr_luis",
};

// Cuenta propia por prueba: las E2E mueven dinero en paralelo sin compartir saldo con la demo ni entre sí.
export async function createTestAccount(template: TestAccountTemplate): Promise<{ email: string }> {
  const seedUserId = TEMPLATE_USER_ID[template];
  const seedUser = await userRepository.findById(seedUserId);
  if (!seedUser) throw new Error(`No existe la plantilla ${template}.`);

  const suffix = randomUUID().slice(0, 8);
  const user = {
    id: `usr_qa_${suffix}`,
    name: seedUser.name,
    email: `qa-${suffix}@miniwallet.dev`,
    phone: `99${String(randomInt(0, 100_000_000)).padStart(8, "0")}`,
  };

  userRepository.insert(user);
  walletRepository.createFromSeed(seedUserId, user.id);
  contactRepository.createFromSeed(seedUserId, user.id);
  return { email: user.email };
}
