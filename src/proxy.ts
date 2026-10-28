import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";
import { getServerEnv } from "@/server/config/env";

const LOGIN_PATH = "/login";
const HOME_PATH = "/";

export function proxy(request: NextRequest) {
  const session = verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    getServerEnv().SESSION_SECRET,
  );
  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH;

  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL(HOME_PATH, request.url));
  }
  return NextResponse.next();
}

// Privado por defecto: toda página pasa por el proxy salvo API Routes y assets estáticos.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
