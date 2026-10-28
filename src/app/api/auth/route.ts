import { NextResponse } from "next/server";
import type { LoginResponse } from "@/domain/contracts/auth";
import { loginSchema } from "@/domain/schemas/login.schema";
import { authenticate } from "@/server/auth/authService";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/server/auth/session";
import { getServerEnv } from "@/server/config/env";
import { apiError, readJsonBody, validationError } from "@/server/http/responses";
import { simulateLatency } from "@/server/mock/latency";

const AUTH_LATENCY_MS = 600;

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return validationError(parsed.error);

  const env = getServerEnv();
  await simulateLatency(AUTH_LATENCY_MS);

  const result = await authenticate(parsed.data.identifier, {
    simulateErrors: env.ENABLE_TEST_SCENARIOS,
  });

  if (!result.ok) {
    return result.reason === "SERVICE_UNAVAILABLE"
      ? apiError(
          503,
          "SERVICE_UNAVAILABLE",
          "El servicio no está disponible. Intenta de nuevo en unos momentos.",
        )
      : apiError(401, "INVALID_CREDENTIALS", "No encontramos una cuenta con esos datos.");
  }

  const { token, expiresAt } = createSessionToken(result.user.id, env.SESSION_SECRET);
  const response = NextResponse.json<LoginResponse>({
    user: { id: result.user.id, name: result.user.name },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return response;
}

export function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
