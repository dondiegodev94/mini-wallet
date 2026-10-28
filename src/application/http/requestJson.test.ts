/** @jest-environment node */
import { z } from "zod";
import { requestJson } from "./requestJson";

const schema = z.object({ value: z.number() });
const fetchMock = jest.spyOn(globalThis, "fetch");

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterAll(() => fetchMock.mockRestore());

describe("requestJson", () => {
  it("devuelve los datos validados por el esquema", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ value: 1 }));

    await expect(requestJson("/api/x", { method: "GET", schema })).resolves.toEqual({
      ok: true,
      data: { value: 1 },
    });
  });

  it("serializa el cuerpo como JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ value: 1 }));

    await requestJson("/api/x", { method: "POST", schema, body: { a: 1 } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify({ a: 1 }),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("una respuesta exitosa que no cumple el contrato es inesperada", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ value: "uno" }));

    await expect(requestJson("/api/x", { method: "GET", schema })).resolves.toEqual({
      ok: false,
      kind: "unexpected-response",
    });
  });

  it("un error HTTP con cuerpo de error conocido expone el error de la API", async () => {
    const error = { code: "INVALID_CREDENTIALS", message: "No encontramos una cuenta con esos datos." };
    fetchMock.mockResolvedValue(jsonResponse({ error }, 401));

    await expect(requestJson("/api/x", { method: "POST", schema })).resolves.toEqual({
      ok: false,
      kind: "http",
      status: 401,
      error,
    });
  });

  it("un error HTTP sin cuerpo reconocible no expone error de la API", async () => {
    fetchMock.mockResolvedValue(new Response("<html>502</html>", { status: 502 }));

    await expect(requestJson("/api/x", { method: "GET", schema })).resolves.toEqual({
      ok: false,
      kind: "http",
      status: 502,
      error: null,
    });
  });

  it("un fallo de red se reporta como network", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(requestJson("/api/x", { method: "GET", schema })).resolves.toEqual({
      ok: false,
      kind: "network",
    });
  });

  it("[SPEC-AUTH-R13] aborta la solicitud al superar el timeout", async () => {
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );

    await expect(requestJson("/api/x", { method: "GET", schema, timeoutMs: 10 })).resolves.toEqual({
      ok: false,
      kind: "timeout",
    });
  });
});
