import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Session } from "@/domain/models/user";

export const SESSION_COOKIE = "mini-wallet-session";
export const SESSION_TTL_MS = 30 * 60 * 1000;

const payloadSchema = z.object({
  sub: z.string().min(1),
  exp: z.number().int(),
});

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function decodePayload(encodedPayload: string): unknown {
  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
}

export function createSessionToken(
  userId: string,
  secret: string,
  now: number = Date.now(),
): { token: string; expiresAt: number } {
  const expiresAt = now + SESSION_TTL_MS;
  const encodedPayload = Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt })).toString(
    "base64url",
  );
  return { token: `${encodedPayload}.${sign(encodedPayload, secret)}`, expiresAt };
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now: number = Date.now(),
): Session | null {
  if (!token) return null;

  const [encodedPayload, signature, ...rest] = token.split(".");
  if (!encodedPayload || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(encodedPayload, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  const payload = payloadSchema.safeParse(decodePayload(encodedPayload));
  if (!payload.success || payload.data.exp <= now) return null;

  return { userId: payload.data.sub, expiresAt: payload.data.exp };
}

export function sessionCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  } as const;
}
