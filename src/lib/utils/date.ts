import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

export function timeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

export function formatDate(date: Date, pattern: string = "dd MMM yyyy"): string {
  return format(date, pattern, { locale: fr });
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMM yyyy", { locale: fr });
}
