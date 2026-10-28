import { NextResponse } from "next/server";
import type { WalletSummary } from "@/domain/models/wallet";
import { getCurrentSession } from "@/server/auth/currentSession";
import { apiError } from "@/server/http/responses";
import { readMockScenario } from "@/server/mock/scenarios";
import { WalletUnavailableError, getWalletSummary } from "@/server/wallet/walletService";

function unauthorized() {
  return apiError(401, "UNAUTHORIZED", "Tu sesión expiró. Inicia sesión de nuevo.");
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) return unauthorized();

  try {
    const summary = await getWalletSummary(session.userId, {
      scenario: readMockScenario(request.headers),
    });
    return summary ? NextResponse.json<WalletSummary>(summary) : unauthorized();
  } catch (error) {
    if (error instanceof WalletUnavailableError) {
      return apiError(503, "SERVICE_UNAVAILABLE", "No pudimos cargar tu información. Intenta de nuevo.");
    }
    throw error;
  }
}
