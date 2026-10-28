/** @jest-environment node */
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";
import { SESSION_COOKIE, createSessionToken } from "@/server/auth/session";

const SECRET = "test-secret-with-at-least-32-characters";

function requestTo(path: string, token?: string) {
  const request = new NextRequest(new URL(path, "http://localhost"));
  if (token) request.cookies.set(SESSION_COOKIE, token);
  return request;
}

function redirectLocation(response: Response) {
  const location = response.headers.get("location");
  return location ? new URL(location).pathname : null;
}

beforeEach(() => {
  process.env.SESSION_SECRET = SECRET;
});

describe("[SPEC-AUTH-R10] páginas privadas por defecto", () => {
  it.each(["/", "/transfer", "/transfer/review", "/cualquier-pagina-nueva"])(
    "%s sin sesión redirige a /login",
    (path) => {
      expect(redirectLocation(proxy(requestTo(path)))).toBe("/login");
    },
  );

  it("una sesión alterada equivale a no tener sesión", () => {
    const { token } = createSessionToken("usr_ana", SECRET);
    expect(redirectLocation(proxy(requestTo("/", `${token}x`)))).toBe("/login");
  });

  it("una sesión válida deja pasar a la página privada", () => {
    const { token } = createSessionToken("usr_ana", SECRET);
    const response = proxy(requestTo("/transfer", token));

    expect(redirectLocation(response)).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("/login sin sesión es accesible", () => {
    expect(redirectLocation(proxy(requestTo("/login")))).toBeNull();
  });

  it("excluye las API Routes y los assets estáticos del matcher", () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(pattern.test("/api/auth")).toBe(false);
    expect(pattern.test("/_next/static/chunk.js")).toBe(false);
    expect(pattern.test("/favicon.ico")).toBe(false);
    expect(pattern.test("/transfer")).toBe(true);
  });
});

describe("[SPEC-AUTH-R11] /login con sesión activa", () => {
  it("redirige a /", () => {
    const { token } = createSessionToken("usr_ana", SECRET);
    expect(redirectLocation(proxy(requestTo("/login", token)))).toBe("/");
  });
});
