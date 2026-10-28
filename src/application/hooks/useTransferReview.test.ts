import { act, renderHook } from "@testing-library/react";
import type { Contact } from "@/domain/models/contact";
import { sendTransfer } from "@/application/http/sendTransfer";
import { resetTransferDraft, useTransferStore } from "@/application/store/transferStore";
import { TRANSFER_ROUTE, useTransferReview } from "./useTransferReview";
import { TRANSFER_STATUS_ROUTE } from "./useTransferStatus";

const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
jest.mock("@/application/http/sendTransfer", () => ({ sendTransfer: jest.fn() }));

const MARIANA: Contact = {
  id: "ct_mariana",
  name: "Mariana Soto",
  bank: "BBVA",
  accountType: "CLABE",
  maskedAccount: "•••• 7899",
};

function prepareReview() {
  return useTransferStore
    .getState()
    .prepareReview({ amountCents: 10000, contact: MARIANA, concept: "Renta", balanceCents: 50000 });
}

beforeEach(() => {
  resetTransferDraft();
  push.mockClear();
  replace.mockClear();
  jest.mocked(sendTransfer).mockReset().mockReturnValue(new Promise(() => undefined));
});

describe("useTransferReview", () => {
  it("[SPEC-TX-R11][SPEC-TX-AC09] sin borrador redirige a /transfer", () => {
    const { result } = renderHook(() => useTransferReview());

    expect(result.current.review).toBeNull();
    expect(replace).toHaveBeenCalledWith(TRANSFER_ROUTE);
  });

  it("[SPEC-TX-AC08] editar vuelve a /transfer conservando el borrador", () => {
    useTransferStore.getState().setAmountInput("100.00");
    prepareReview();
    const { result } = renderHook(() => useTransferReview());

    act(() => result.current.edit());

    expect(replace).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(TRANSFER_ROUTE);
    expect(useTransferStore.getState().amountInput).toBe("100.00");
  });

  it("[SPEC-TX-AC10] cancelar descarta el borrador y vuelve al Home", () => {
    prepareReview();
    const { result } = renderHook(() => useTransferReview());

    act(() => result.current.cancel());

    expect(useTransferStore.getState().review).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
  });
});

describe("Confirmar transferencia", () => {
  it("[SPEC-CONF-R15] envía con la clave del resumen, descarta el borrador y reemplaza el resumen por el estado", () => {
    const review = prepareReview();
    const { result } = renderHook(() => useTransferReview());

    act(() => result.current.confirm());

    expect(sendTransfer).toHaveBeenCalledWith({
      idempotencyKey: review.idempotencyKey,
      contact: MARIANA,
      amountCents: 10000,
      concept: "Renta",
    });
    expect(useTransferStore.getState().review).toBeNull();
    expect(result.current.isSubmitted).toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(TRANSFER_STATUS_ROUTE);
  });

  it("[SPEC-CONF-R15] un fallo inmediato no desvía la navegación al estado", async () => {
    jest.mocked(sendTransfer).mockResolvedValue({ status: "NETWORK_ERROR" });
    prepareReview();
    const { result } = renderHook(() => useTransferReview());

    await act(async () => result.current.confirm());

    expect(useTransferStore.getState().submission?.phase).toBe("done");
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(TRANSFER_STATUS_ROUTE);
  });

  it("[SPEC-CONF-R14][SPEC-CONF-AC08] un doble clic envía una sola solicitud", () => {
    prepareReview();
    const { result } = renderHook(() => useTransferReview());

    act(() => {
      result.current.confirm();
      result.current.confirm();
    });

    expect(sendTransfer).toHaveBeenCalledTimes(1);
  });
});
