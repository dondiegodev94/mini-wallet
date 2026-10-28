import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Session } from "@/domain/models/user";
import { getServerEnv } from "@/server/config/env";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  // La vigencia depende de la hora actual: nunca debe evaluarse dentro de un prerender.
  await connection();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value, getServerEnv().SESSION_SECRET);
}
