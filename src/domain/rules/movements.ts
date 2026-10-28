import type { Movement } from "@/domain/models/wallet";

export const RECENT_MOVEMENTS_LIMIT = 10;

export function selectRecentMovements(
  movements: readonly Movement[],
  limit: number = RECENT_MOVEMENTS_LIMIT,
): Movement[] {
  return [...movements]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, limit);
}
