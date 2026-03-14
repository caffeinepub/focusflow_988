import { format, isToday, isTomorrow, isPast } from "date-fns";
import type { Priority } from "../hooks/useQueries";

export const priorityColors: Record<Priority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-secondary text-muted-foreground",
};

export function formatDueDate(nanoseconds: number | null): string | null {
  if (!nanoseconds) return null;
  const date = new Date(nanoseconds / 1_000_000);
  const time = format(date, "h:mm a");

  if (isToday(date)) return `Today at ${time}`;
  if (isTomorrow(date)) return `Tomorrow at ${time}`;

  const dateStr = format(
    date,
    date.getFullYear() === new Date().getFullYear() ? "MMM d" : "MMM d, yyyy",
  );
  return `${dateStr} at ${time}`;
}

export function isOverdue(nanoseconds: number | null): boolean {
  if (!nanoseconds) return false;
  return isPast(new Date(nanoseconds / 1_000_000));
}
