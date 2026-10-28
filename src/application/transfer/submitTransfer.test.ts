import type { Contact } from "@/domain/models/contact";
import { sendTransfer } from "@/application/http/sendTransfer";
import { hardNavigate } from "@/application/navigation/hardNavigate";
import { resetTransferDraft, useTransferStore } from "@/application/store/transferStore";
import { submitTransfer } from "./submitTransfer";

jest.mock("@/application/http/sendTransfer", () => ({ sendTransfer: jest.fn() }));
jest.mock("@/application/navigation/hardNavigate", () => ({ hardNavigate: jest.fn() }));

const MARIANA: Contact = {
  id: "ct_mariana",
  name: "Mariana Soto",
  bank: "BBVA",
  accountType: "CLABE",
  maskedAccount: "•••• 7899",
};
const PENDING = { idempotencyKey: "key-1", contact: MARIANA, amountCents: 100, concept: "" };

beforeEach(() => {
  resetTransferDraft();
  jest.mocked(sendTransfer).mockReset();
  jest.mocked(hardNavigate).mockReset();
});

describe("submitTransfer", () => {
  it("queda procesando mientras espera la respuesta y luego guarda el resultado", async () => {
    let resolve: (value: Awaited<ReturnType<typeof sendTransfer>>) => void = () => undefined;
    jest.mocked(sendTransfer).mockReturnValue(new Promise((done) => (resolve = done)));

    const submission = submitTransfer(PENDING);
    expect(useTransferStore.getState().submission).toEqual({ phase: "processing", pending: PENDING });

    resolve({ status: "NETWORK_ERROR" });
    await submission;

    expect(useTransferStore.getState().submission).toEqual({
      phase: "done",
      outcome: { status: "NETWORK_ERROR" },
      pending: PENDING,
    });
  });

  it("[SPEC-CONF-R17] con la sesión expirada descarta todo y recarga en /login", async () => {
    jest.mocked(sendTransfer).mockResolvedValue({ status: "SESSION_EXPIRED" });

    await submitTransfer(PENDING);

    expect(useTransferStore.getState().submission).toBeNull();
    expect(hardNavigate).toHaveBeenCalledWith("/login");
  });
});
