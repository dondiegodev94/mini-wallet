import { act, renderHook } from "@testing-library/react";
import { requestJson } from "@/application/http/requestJson";
import { REQUEST_ERROR_MESSAGES } from "@/application/http/requestErrorMessage";
import { LOGIN_ROUTE, LOGOUT_ENDPOINT, useLogout } from "./useLogout";

const replace = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
jest.mock("@/application/http/requestJson", () => ({ requestJson: jest.fn() }));

const requestJsonMock = jest.mocked(requestJson);

describe("[SPEC-HOME-R10] cerrar sesión", () => {
  it("[SPEC-HOME-AC07] elimina la sesión y navega a /login", async () => {
    requestJsonMock.mockResolvedValue({ ok: true, data: null });
    const { result } = renderHook(() => useLogout());

    await act(() => result.current.logout());

    expect(requestJsonMock).toHaveBeenCalledWith(
      LOGOUT_ENDPOINT,
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(replace).toHaveBeenCalledWith(LOGIN_ROUTE);
    expect(refresh).toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
  });

  it("si falla, permanece en la página e informa el error", async () => {
    requestJsonMock.mockResolvedValue({ ok: false, kind: "network" });
    const { result } = renderHook(() => useLogout());

    await act(() => result.current.logout());

    expect(replace).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe(REQUEST_ERROR_MESSAGES.network);
  });

  it("ignora clics repetidos mientras la solicitud está en vuelo", () => {
    requestJsonMock.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useLogout());

    act(() => {
      void result.current.logout();
      void result.current.logout();
    });

    expect(requestJsonMock).toHaveBeenCalledTimes(1);
  });
});
