import { act, renderHook } from "@testing-library/react";
import type { Contact } from "@/domain/models/contact";
import { resetTransferDraft, useTransferStore } from "@/application/store/transferStore";
import { TRANSFER_ROUTE, useTransferReview } from "./useTransferReview";

const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

const MARIANA: Contact = {
  id: "ct_mariana",
  name: "Mariana Soto",
  bank: "BBVA",
  accountType: "CLABE",
  maskedAccount: "•••• 7899",
};

beforeEach(() => resetTransferDraft());

describe("useTransferReview", () => {
  it("[SPEC-TX-R11][SPEC-TX-AC09] sin borrador redirige a /transfer", () => {
    const { result } = renderHook(() => useTransferReview());

    expect(result.current.review).toBeNull();
    expect(replace).toHaveBeenCalledWith(TRANSFER_ROUTE);
  });

  it("[SPEC-TX-AC08] editar vuelve a /transfer conservando el borrador", () => {
    useTransferStore.getState().setAmountInput("100.00");
    useTransferStore
      .getState()
      .prepareReview({ amountCents: 10000, contact: MARIANA, concept: "", balanceCents: 50000 });
    const { result } = renderHook(() => useTransferReview());

    act(() => result.current.edit());

    expect(replace).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(TRANSFER_ROUTE);
    expect(useTransferStore.getState().amountInput).toBe("100.00");
  });

  it("[SPEC-TX-AC10] cancelar descarta el borrador y vuelve al Home", () => {
    useTransferStore
      .getState()
      .prepareReview({ amountCents: 10000, contact: MARIANA, concept: "", balanceCents: 50000 });
    const { result } = renderHook(() => useTransferReview());

    act(() => result.current.cancel());

    expect(useTransferStore.getState().review).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
  });
});
