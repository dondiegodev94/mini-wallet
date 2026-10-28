import { act, renderHook } from "@testing-library/react";
import { requestJson } from "@/application/http/requestJson";
import { REQUEST_ERROR_MESSAGES } from "@/application/http/requestErrorMessage";
import { hardNavigate } from "@/application/navigation/hardNavigate";
import { useTransferStore } from "@/application/store/transferStore";
import { LOGIN_ROUTE, LOGOUT_ENDPOINT, useLogout } from "./useLogout";

jest.mock("@/application/navigation/hardNavigate", () => ({ hardNavigate: jest.fn() }));
jest.mock("@/application/http/requestJson", () => ({ requestJson: jest.fn() }));

const requestJsonMock = jest.mocked(requestJson);
const hardNavigateMock = jest.mocked(hardNavigate);

describe("[SPEC-HOME-R10] cerrar sesión", () => {
  it("[SPEC-HOME-AC07] elimina la sesión y navega a /login con una carga completa", async () => {
    requestJsonMock.mockResolvedValue({ ok: true, data: null });
    const { result } = renderHook(() => useLogout());

    await act(() => result.current.logout());

    expect(requestJsonMock).toHaveBeenCalledWith(
      LOGOUT_ENDPOINT,
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(hardNavigateMock).toHaveBeenCalledWith(LOGIN_ROUTE);
    expect(result.current.isPending).toBe(false);
  });

  it("[SPEC-TX-R14] descarta el borrador de transferencia antes de navegar", async () => {
    useTransferStore.getState().setAmountInput("1500");
    requestJsonMock.mockResolvedValue({ ok: true, data: null });
    hardNavigateMock.mockImplementation(() => {
      expect(useTransferStore.getState().amountInput).toBe("");
    });
    const { result } = renderHook(() => useLogout());

    await act(() => result.current.logout());

    expect(hardNavigateMock).toHaveBeenCalledTimes(1);
  });

  it("si falla, permanece en la página e informa el error", async () => {
    requestJsonMock.mockResolvedValue({ ok: false, kind: "network" });
    const { result } = renderHook(() => useLogout());

    await act(() => result.current.logout());

    expect(hardNavigateMock).not.toHaveBeenCalled();
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
