const DEFAULT_REQUEST_TIMEOUT_MS = 4000;
const DEFAULT_TRANSFER_TIMEOUT_MS = 15_000;

export function readTimeoutMs(raw: string | undefined, fallback: number): number {
  const configured = Number(raw);
  return Number.isFinite(configured) && configured > 0 ? configured : fallback;
}

// Next.js solo inyecta variables NEXT_PUBLIC_* en el cliente si se leen con el nombre literal.
export const REQUEST_TIMEOUT_MS = readTimeoutMs(
  process.env.NEXT_PUBLIC_TIMEOUT_MS,
  DEFAULT_REQUEST_TIMEOUT_MS,
);

export const TRANSFER_TIMEOUT_MS = readTimeoutMs(
  process.env.NEXT_PUBLIC_TRANSFER_TIMEOUT_MS,
  DEFAULT_TRANSFER_TIMEOUT_MS,
);
