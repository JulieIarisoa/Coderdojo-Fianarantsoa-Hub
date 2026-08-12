import { timeAgo } from "./date";

type TimestampLike = unknown;

export function countUnread<T extends { read: boolean }>(
  items: T[] | null | undefined,
): number {
  if (!items) return 0;
  return items.filter((item) => !item.read).length;
}

function toDate(value: TimestampLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : new Date(time);
  }
  if (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return new Date((value as { toMillis: () => number }).toMillis());
  }
  return null;
}

export function notificationTime(createdAt: TimestampLike): string {
  const date = toDate(createdAt);
  if (!date) return "";
  return timeAgo(date);
}

export function createdAtMillis(createdAt: TimestampLike): number {
  return toDate(createdAt)?.getTime() ?? 0;
}
