import type { z } from "zod";
import { apiErrorBodySchema, type ApiError } from "@/domain/contracts/api";
import { REQUEST_TIMEOUT_MS } from "@/application/config";

export type RequestFailure =
  | { kind: "http"; status: number; error: ApiError | null }
  | { kind: "timeout" }
  | { kind: "network" }
  | { kind: "unexpected-response" };

export type RequestResult<T> = { ok: true; data: T } | ({ ok: false } & RequestFailure);

type RequestOptions<T> = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  schema: z.ZodType<T>;
  body?: unknown;
  timeoutMs?: number;
};

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function requestJson<T>(
  url: string,
  { method, schema, body, timeoutMs = REQUEST_TIMEOUT_MS }: RequestOptions<T>,
): Promise<RequestResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await readBody(response);

    if (!response.ok) {
      const parsedError = apiErrorBodySchema.safeParse(payload);
      return {
        ok: false,
        kind: "http",
        status: response.status,
        error: parsedError.success ? parsedError.data.error : null,
      };
    }

    const parsed = schema.safeParse(payload);
    return parsed.success
      ? { ok: true, data: parsed.data }
      : { ok: false, kind: "unexpected-response" };
  } catch {
    return controller.signal.aborted ? { ok: false, kind: "timeout" } : { ok: false, kind: "network" };
  } finally {
    clearTimeout(timer);
  }
}
