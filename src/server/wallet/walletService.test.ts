/** @jest-environment node */
import { walletSummarySchema } from "@/domain/contracts/wallet";
import { WalletUnavailableError, getWalletSummary } from "./walletService";

jest.mock("@/server/mock/latency", () => ({ simulateLatency: () => Promise.resolve() }));

const noScenario = { scenario: null };

describe("getWalletSummary", () => {
  it("[SPEC-HOME-AC01] devuelve el nombre y el saldo del usuario", async () => {
    const summary = await getWalletSummary("usr_ana", noScenario);

    expect(summary?.user).toEqual({ id: "usr_ana", name: "Ana García" });
    expect(summary?.balanceCents).toBe(1245075);
  });

  it("[SPEC-HOME-R01] el resumen cumple el contrato público", async () => {
    const summary = await getWalletSummary("usr_ana", noScenario);
    expect(walletSummarySchema.safeParse(summary).success).toBe(true);
  });

  it("[SPEC-HOME-AC02] devuelve los 10 movimientos más recientes, del más nuevo al más antiguo", async () => {
    const summary = await getWalletSummary("usr_ana", noScenario);

    expect(summary?.movements).toHaveLength(10);
    expect(summary?.movements[0]?.id).toBe("mov_012");
    expect(summary?.movements.at(-1)?.id).toBe("mov_003");
  });

  it("[SPEC-HOME-AC03] un usuario sin movimientos recibe una lista vacía", async () => {
    const summary = await getWalletSummary("usr_luis", noScenario);

    expect(summary?.movements).toEqual([]);
    expect(summary?.balanceCents).toBe(300000);
  });

  it("[SPEC-HOME-R07] un usuario inexistente no tiene resumen", async () => {
    await expect(getWalletSummary("usr_fantasma", noScenario)).resolves.toBeNull();
  });

  it("[SPEC-HOME-R08] el escenario WALLET_UNAVAILABLE simula la caída del servicio", async () => {
    await expect(
      getWalletSummary("usr_ana", { scenario: "WALLET_UNAVAILABLE" }),
    ).rejects.toBeInstanceOf(WalletUnavailableError);
  });
});
