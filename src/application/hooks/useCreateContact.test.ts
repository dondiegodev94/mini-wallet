import { act, renderHook } from "@testing-library/react";
import type { Contact } from "@/domain/models/contact";
import { CONTACT_MESSAGES } from "@/domain/schemas/contact.schema";
import { requestJson, type RequestResult } from "@/application/http/requestJson";
import { REQUEST_ERROR_MESSAGES } from "@/application/http/requestErrorMessage";
import { CONTACTS_ENDPOINT, useCreateContact } from "./useCreateContact";

jest.mock("@/application/http/requestJson", () => ({ requestJson: jest.fn() }));

const requestJsonMock = jest.mocked(requestJson);

const CREATED: Contact = {
  id: "ct_new",
  name: "Beatriz Ríos",
  bank: "HSBC",
  accountType: "CARD",
  maskedAccount: "•••• 7659",
};
const SUCCESS: RequestResult<unknown> = { ok: true, data: { contact: CREATED } };

function renderCreateContact() {
  const onCreated = jest.fn();
  const hook = renderHook(() => useCreateContact(onCreated));
  return { ...hook, onCreated };
}

function fillValidCard(result: ReturnType<typeof renderCreateContact>["result"]) {
  act(() => {
    result.current.setName("Beatriz  Ríos");
    result.current.setAccountType("CARD");
  });
  act(() => {
    result.current.setAccount("4027660012987659");
    result.current.setBank("HSBC");
  });
}

describe("useCreateContact", () => {
  it("[SPEC-CT-AC05] con campos inválidos no llama al API y señala el primero", async () => {
    const { result } = renderCreateContact();
    act(() => result.current.setAccount("551234567"));

    let invalidField: string | null = null;
    await act(async () => {
      invalidField = await result.current.submit();
    });

    expect(invalidField).toBe("name");
    expect(result.current.fieldErrors).toEqual({
      name: CONTACT_MESSAGES.nameRequired,
      account: CONTACT_MESSAGES.accountLength.PHONE,
      bank: CONTACT_MESSAGES.bankRequired,
    });
    expect(requestJsonMock).not.toHaveBeenCalled();
  });

  it("[SPEC-CT-R02] cambiar el tipo vacía el número y su error", async () => {
    const { result } = renderCreateContact();
    act(() => result.current.setAccount("55123"));
    await act(async () => {
      await result.current.submit();
    });

    act(() => result.current.setAccountType("CLABE"));

    expect(result.current.values).toMatchObject({ accountType: "CLABE", account: "" });
    expect(result.current.fieldErrors.account).toBeUndefined();
  });

  it("[SPEC-CT-AC03][SPEC-CT-R13] envía el contacto normalizado, limpia el formulario y lo notifica", async () => {
    requestJsonMock.mockResolvedValue(SUCCESS);
    const { result, onCreated } = renderCreateContact();
    fillValidCard(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(requestJsonMock).toHaveBeenCalledWith(
      CONTACTS_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        body: { name: "Beatriz Ríos", accountType: "CARD", account: "4027660012987659", bank: "HSBC" },
      }),
    );
    expect(onCreated).toHaveBeenCalledWith(CREATED);
    expect(result.current.values).toEqual({ name: "", accountType: "PHONE", account: "", bank: "" });
    expect(result.current.isSubmitting).toBe(false);
  });

  it("[SPEC-CT-AC06][SPEC-CT-R14] muestra el duplicado en el campo de cuenta y conserva lo capturado", async () => {
    requestJsonMock.mockResolvedValue({
      ok: false,
      kind: "http",
      status: 409,
      error: {
        code: "CONTACT_ALREADY_EXISTS",
        message: CONTACT_MESSAGES.duplicate,
        fieldErrors: { account: [CONTACT_MESSAGES.duplicate] },
      },
    });
    const { result, onCreated } = renderCreateContact();
    fillValidCard(result);

    let invalidField: string | null = null;
    await act(async () => {
      invalidField = await result.current.submit();
    });

    expect(invalidField).toBe("account");
    expect(result.current.fieldErrors.account).toBe(CONTACT_MESSAGES.duplicate);
    expect(result.current.values.account).toBe("4027660012987659");
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("[SPEC-CT-R14] un fallo sin campo se muestra como alerta del formulario", async () => {
    requestJsonMock.mockResolvedValue({ ok: false, kind: "network" });
    const { result } = renderCreateContact();
    fillValidCard(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.formError).toBe(REQUEST_ERROR_MESSAGES.network);

    act(() => result.current.setName("Beatriz R."));
    expect(result.current.formError).toBeNull();
  });

  it("[SPEC-CT-R13] ignora envíos repetidos mientras hay uno en vuelo", async () => {
    requestJsonMock.mockReturnValue(new Promise(() => undefined));
    const { result } = renderCreateContact();
    fillValidCard(result);

    act(() => {
      void result.current.submit();
      void result.current.submit();
    });

    expect(requestJsonMock).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(true);
  });
});
