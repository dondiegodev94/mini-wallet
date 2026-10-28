/** @jest-environment node */
import { POST } from "./route";
import { contactRepository } from "@/server/contacts/contactRepository";
import { userRepository } from "@/server/users/userRepository";
import { walletRepository } from "@/server/wallet/walletRepository";

function createAccount(body: unknown) {
  return POST(
    new Request("http://localhost/api/test/accounts", { method: "POST", body: JSON.stringify(body) }),
  );
}

async function userFor(email: string) {
  const user = await userRepository.findByIdentifier({ kind: "email", value: email });
  if (!user) throw new Error("La cuenta no se creó.");
  return user;
}

beforeEach(() => {
  process.env.SESSION_SECRET = "test-secret-with-at-least-32-characters";
  process.env.ENABLE_TEST_SCENARIOS = "true";
  userRepository.reset();
  walletRepository.reset();
  contactRepository.reset();
});

describe("[SPEC-CONF-R24] cuentas de prueba aisladas", () => {
  it("la plantilla ana copia saldo, movimientos y contactos con un email único", async () => {
    const response = await createAccount({ template: "ana" });
    const { email } = await response.json();
    const user = await userFor(email);

    expect(response.status).toBe(201);
    expect(email).toMatch(/^qa-[0-9a-f]{8}@miniwallet\.dev$/);
    expect(user.name).toBe("Ana García");
    expect(walletRepository.getBalance(user.id)).toBe(1245075);
    expect((await walletRepository.findByUserId(user.id))?.movements).toHaveLength(12);
    expect(contactRepository.listByUserId(user.id).map((contact) => contact.id)).toEqual([
      "ct_carlos",
      "ct_luis",
      "ct_mariana",
    ]);
  });

  it("la plantilla luis no tiene movimientos ni contactos", async () => {
    const { email } = await (await createAccount({ template: "luis" })).json();
    const user = await userFor(email);

    expect(walletRepository.getBalance(user.id)).toBe(300000);
    expect((await walletRepository.findByUserId(user.id))?.movements).toEqual([]);
    expect(contactRepository.listByUserId(user.id)).toEqual([]);
  });

  it("cada cuenta es independiente de la plantilla y de las demás", async () => {
    const first = await userFor((await (await createAccount({ template: "ana" })).json()).email);
    const second = await userFor((await (await createAccount({ template: "ana" })).json()).email);

    walletRepository.debit(first.id, {
      id: "mov_test",
      type: "DEBIT",
      amountCents: 100,
      counterparty: "Mariana Soto",
      concept: "Prueba",
      occurredAt: new Date().toISOString(),
    });

    expect(first.id).not.toBe(second.id);
    expect(walletRepository.getBalance(first.id)).toBe(1244975);
    expect(walletRepository.getBalance(second.id)).toBe(1245075);
    expect(walletRepository.getBalance("usr_ana")).toBe(1245075);
  });

  it("rechaza una plantilla desconocida", async () => {
    expect((await createAccount({ template: "root" })).status).toBe(400);
  });

  it("sin escenarios de prueba la ruta no existe", async () => {
    process.env.ENABLE_TEST_SCENARIOS = "false";
    const response = await createAccount({ template: "ana" });

    expect(response.status).toBe(404);
  });
});
