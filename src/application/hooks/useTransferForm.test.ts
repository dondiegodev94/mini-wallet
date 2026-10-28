import { act, renderHook } from "@testing-library/react";
import type { Contact } from "@/domain/models/contact";
import { TRANSFER_MESSAGES } from "@/domain/rules/transfer";
import { resetTransferDraft, useTransferStore } from "@/application/store/transferStore";
import { HOME_ROUTE, TRANSFER_REVIEW_ROUTE, useTransferForm } from "./useTransferForm";

const push = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const BALANCE = 1245075;
const MARIANA: Contact = {
  id: "ct_mariana",
  name: "Mariana Soto",
  bank: "BBVA",
  accountType: "CLABE",
  maskedAccount: "•••• 7899",
};

function renderForm() {
  return renderHook(() => useTransferForm(BALANCE));
}

beforeEach(() => resetTransferDraft());

describe("useTransferForm", () => {
  it("[SPEC-TX-R07] no muestra errores antes de salir del campo o de continuar", () => {
    const { result } = renderForm();
    expect(result.current.errors).toEqual({ amount: undefined, contactId: undefined, concept: undefined });
  });

  it("[SPEC-TX-R06][SPEC-TX-R07] al salir del campo completa los centavos y muestra los errores en vivo", () => {
    const { result } = renderForm();

    act(() => result.current.setAmountInput("1500"));
    act(() => result.current.blurAmount());
    expect(result.current.amountInput).toBe("1500.00");
    expect(result.current.errors.amount).toBeUndefined();

    act(() => result.current.setAmountInput("0"));
    expect(result.current.errors.amount).toBe(TRANSFER_MESSAGES.amountPositive);
  });

  it("[SPEC-TX-AC03][SPEC-TX-R16] con el monto vacío no continúa y señala el monto", () => {
    const { result } = renderForm();
    act(() => result.current.selectContact(MARIANA));

    let invalidField: string | null = null;
    act(() => {
      invalidField = result.current.submit();
    });

    expect(invalidField).toBe("amount");
    expect(result.current.errors.amount).toBe(TRANSFER_MESSAGES.amountRequired);
    expect(push).not.toHaveBeenCalled();
  });

  it("[SPEC-TX-AC04] con un monto mayor al saldo no continúa", () => {
    const { result } = renderForm();
    act(() => {
      result.current.selectContact(MARIANA);
      result.current.setAmountInput("12450.76");
    });

    act(() => {
      result.current.submit();
    });

    expect(result.current.errors.amount).toBe(TRANSFER_MESSAGES.insufficientFunds(BALANCE));
    expect(push).not.toHaveBeenCalled();
  });

  it("[SPEC-TX-AC06] sin destinatario no continúa y señala el destinatario", () => {
    const { result } = renderForm();
    act(() => result.current.setAmountInput("100"));

    let invalidField: string | null = null;
    act(() => {
      invalidField = result.current.submit();
    });

    expect(invalidField).toBe("contactId");
    expect(result.current.errors.contactId).toBe(TRANSFER_MESSAGES.recipientRequired);
  });

  it("[SPEC-TX-AC05][SPEC-TX-R13] un borrador válido prepara el resumen con su clave y navega", () => {
    const { result } = renderForm();
    act(() => {
      result.current.selectContact(MARIANA);
      result.current.setAmountInput("12450.75");
      result.current.setConcept("  Renta ");
    });

    act(() => {
      result.current.submit();
    });

    const { review, amountInput } = useTransferStore.getState();
    expect(review).toMatchObject({
      amountCents: BALANCE,
      contact: MARIANA,
      concept: "Renta",
      balanceCents: BALANCE,
    });
    expect(review?.idempotencyKey).toEqual(expect.any(String));
    expect(amountInput).toBe("12450.75");
    expect(push).toHaveBeenCalledWith(TRANSFER_REVIEW_ROUTE);
    expect(result.current.errors.amount).toBeUndefined();
  });

  it("[SPEC-TX-AC10][SPEC-TX-R14] cancelar descarta el borrador y vuelve al Home", () => {
    const { result } = renderForm();
    act(() => {
      result.current.selectContact(MARIANA);
      result.current.setAmountInput("100");
    });

    act(() => result.current.cancel());

    expect(useTransferStore.getState()).toMatchObject({ amountInput: "", contact: null, review: null });
    expect(push).toHaveBeenCalledWith(HOME_ROUTE);
  });
});
