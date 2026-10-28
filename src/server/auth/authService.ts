import "server-only";
import type { Identifier } from "@/domain/schemas/login.schema";
import type { User } from "@/domain/models/user";
import { userRepository } from "@/server/users/userRepository";

export const SIMULATED_ERROR_EMAIL = "error@miniwallet.dev";

export type AuthenticationResult =
  | { ok: true; user: User }
  | { ok: false; reason: "INVALID_CREDENTIALS" | "SERVICE_UNAVAILABLE" };

export async function authenticate(
  identifier: Identifier,
  options: { simulateErrors: boolean },
): Promise<AuthenticationResult> {
  if (
    options.simulateErrors &&
    identifier.kind === "email" &&
    identifier.value === SIMULATED_ERROR_EMAIL
  ) {
    return { ok: false, reason: "SERVICE_UNAVAILABLE" };
  }

  const user = await userRepository.findByIdentifier(identifier);
  return user ? { ok: true, user } : { ok: false, reason: "INVALID_CREDENTIALS" };
}
