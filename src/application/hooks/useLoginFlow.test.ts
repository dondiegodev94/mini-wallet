import { act, renderHook } from "@testing-library/react";
import { LOGIN_MESSAGES } from "@/domain/schemas/login.schema";
import { requestJson, type RequestResult } from "@/application/http/requestJson";
import { REQUEST_ERROR_MESSAGES } from "@/application/http/requestErrorMessage";
import { HOME_ROUTE, LOGIN_ENDPOINT, useLoginFlow } from "./useLoginFlow";

const replace = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
jest.mock("@/application/http/requestJson", () => ({ requestJson: jest.fn() }));

const requestJsonMock = jest.mocked(requestJson);

const SUCCESS: RequestResult<unknown> = {
  ok: true,
  data: { user: { id: "usr_ana", name: "Ana García" } },
};

function renderLoginFlow(identifier: string) {
  const hook = renderHook(() => useLoginFlow());
  act(() => hook.result.current.setIdentifier(identifier));
  return hook;
}

describe("useLoginFlow", () => {
  it("[SPEC-AUTH-AC02] con el campo vacío muestra el error y no llama al API", async () => {
    const { result } = renderLoginFlow("   ");

    await act(() => result.current.submit());

    expect(result.current.fieldError).toBe(LOGIN_MESSAGES.required);
    expect(result.current.status).toBe("error");
    expect(requestJsonMock).not.toHaveBeenCalled();
  });

  it("[SPEC-AUTH-AC03] con formato inválido muestra el error y no llama al API", async () => {
    const { result } = renderLoginFlow("55123");

    await act(() => result.current.submit());

    expect(result.current.fieldError).toBe(LOGIN_MESSAGES.invalidPhone);
    expect(requestJsonMock).not.toHaveBeenCalled();
  });

  it("[SPEC-AUTH-AC01] login exitoso navega al Home", async () => {
    requestJsonMock.mockResolvedValue(SUCCESS);
    const { result } = renderLoginFlow("ana@miniwallet.dev");

    await act(() => result.current.submit());

    expect(requestJsonMock).toHaveBeenCalledWith(
      LOGIN_ENDPOINT,
      expect.objectContaining({ method: "POST", body: { identifier: "ana@miniwallet.dev" } }),
    );
    expect(result.current.status).toBe("success");
    expect(result.current.isSubmitting).toBe(true);
    expect(replace).toHaveBeenCalledWith(HOME_ROUTE);
  });

  it("expone el estado de carga mientras la solicitud está en vuelo", async () => {
    let resolveRequest: (value: RequestResult<unknown>) => void = () => undefined;
    requestJsonMock.mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)));
    const { result } = renderLoginFlow("ana@miniwallet.dev");

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.submit();
    });
    expect(result.current.status).toBe("submitting");
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveRequest(SUCCESS);
      await pending;
    });
  });

  it("[SPEC-AUTH-R12] ignora envíos repetidos mientras hay uno en vuelo", async () => {
    requestJsonMock.mockReturnValue(new Promise(() => undefined));
    const { result } = renderLoginFlow("ana@miniwallet.dev");

    act(() => {
      void result.current.submit();
      void result.current.submit();
    });

    expect(requestJsonMock).toHaveBeenCalledTimes(1);
  });

  it("[SPEC-AUTH-AC04] muestra el mensaje del servidor y permite reintentar", async () => {
    requestJsonMock.mockResolvedValueOnce({
      ok: false,
      kind: "http",
      status: 401,
      error: { code: "INVALID_CREDENTIALS", message: "No encontramos una cuenta con esos datos." },
    });
    const { result } = renderLoginFlow("nadie@miniwallet.dev");

    await act(() => result.current.submit());

    expect(result.current.formError).toBe("No encontramos una cuenta con esos datos.");
    expect(result.current.isSubmitting).toBe(false);
    expect(replace).not.toHaveBeenCalled();

    requestJsonMock.mockResolvedValueOnce(SUCCESS);
    await act(() => result.current.submit());
    expect(requestJsonMock).toHaveBeenCalledTimes(2);
  });

  it("muestra el error de campo devuelto por la validación del servidor", async () => {
    requestJsonMock.mockResolvedValue({
      ok: false,
      kind: "http",
      status: 400,
      error: {
        code: "VALIDATION_ERROR",
        message: LOGIN_MESSAGES.invalidEmail,
        fieldErrors: { identifier: [LOGIN_MESSAGES.invalidEmail] },
      },
    });
    const { result } = renderLoginFlow("ana@miniwallet.dev");

    await act(() => result.current.submit());

    expect(result.current.fieldError).toBe(LOGIN_MESSAGES.invalidEmail);
    expect(result.current.formError).toBeNull();
  });

  it("[SPEC-AUTH-R13] informa el timeout", async () => {
    requestJsonMock.mockResolvedValue({ ok: false, kind: "timeout" });
    const { result } = renderLoginFlow("ana@miniwallet.dev");

    await act(() => result.current.submit());

    expect(result.current.formError).toBe(REQUEST_ERROR_MESSAGES.timeout);
  });

  it("al editar el campo se limpian los errores", async () => {
    requestJsonMock.mockResolvedValue({ ok: false, kind: "network" });
    const { result } = renderLoginFlow("ana@miniwallet.dev");
    await act(() => result.current.submit());
    expect(result.current.formError).toBe(REQUEST_ERROR_MESSAGES.network);

    act(() => result.current.setIdentifier("ana@miniwallet.de"));

    expect(result.current.formError).toBeNull();
    expect(result.current.fieldError).toBeNull();
  });
});
