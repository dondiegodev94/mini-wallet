import { act, renderHook } from "@testing-library/react";
import type { Contact } from "@/domain/models/contact";
import { sendTransfer } from "@/application/http/sendTransfer";
import { resetTransferDraft, useTransferStore } from "@/application/store/transferStore";
import { useTransferStatus } from "./useTransferStatus";

const replace = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
jest.mock("@/application/http/sendTransfer", () => ({ sendTransfer: jest.fn() }));

const MARIANA: Contact = {
  id: "ct_mariana",
  name: "Mariana Soto",
  bank: "BBVA",
  accountType: "CLABE",
  maskedAccount: "•••• 7899",
};
const PENDING = { idempotencyKey: "key-1", contact: MARIANA, amountCents: 100, concept: "" };

function finishWith(status: "NETWORK_ERROR" | "TIMEOUT" | "INSUFFICIENT_FUNDS" | "UNKNOWN_ERROR") {
  useTransferStore.getState().beginSubmission(PENDING);
  useTransferStore.getState().completeSubmission(PENDING.idempotencyKey, { status });
}

beforeEach(() => {
  resetTransferDraft();
  replace.mockClear();
  jest.mocked(sendTransfer).mockReset().mockReturnValue(new Promise(() => undefined));
});

describe("useTransferStatus", () => {
  it("[SPEC-CONF-R15][SPEC-CONF-AC09] sin un envío en memoria redirige al Home", () => {
    renderHook(() => useTransferStatus());
    expect(replace).toHaveBeenCalledWith("/");
  });

  it.each(["NETWORK_ERROR", "TIMEOUT"] as const)(
    "[SPEC-CONF-R08][SPEC-CONF-R20] tras %s, reintentar reenvía la misma solicitud con la misma clave",
    (status) => {
      finishWith(status);
      const { result } = renderHook(() => useTransferStatus());

      act(() => result.current.retry());

      expect(sendTransfer).toHaveBeenCalledWith(PENDING);
      expect(result.current.submission).toEqual({ phase: "processing", pending: PENDING });
    },
  );

  it.each(["INSUFFICIENT_FUNDS", "UNKNOWN_ERROR"] as const)("tras %s no hay nada que reintentar", (status) => {
    finishWith(status);
    const { result } = renderHook(() => useTransferStatus());

    act(() => result.current.retry());

    expect(sendTransfer).not.toHaveBeenCalled();
  });

  it("un doble clic en reintentar envía una sola solicitud", () => {
    finishWith("NETWORK_ERROR");
    const { result } = renderHook(() => useTransferStatus());

    act(() => {
      result.current.retry();
      result.current.retry();
    });

    expect(sendTransfer).toHaveBeenCalledTimes(1);
  });

  it("[SPEC-CONF-R18] volver al inicio descarta el envío antes de navegar", () => {
    finishWith("TIMEOUT");
    const { result } = renderHook(() => useTransferStatus());
    replace.mockImplementation(() => expect(useTransferStore.getState().submission).toBeNull());

    act(() => result.current.goHome());

    expect(replace).toHaveBeenCalledWith("/");
    replace.mockReset();
  });
});
