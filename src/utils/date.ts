import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  parseISO,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d)) return format(d, "EEEE");
  if (isThisMonth(d)) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}

export function formatTimeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatFullDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "";
  return format(d, "EEEE, MMMM d, yyyy 'at' h:mm a");
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "";
  return format(d, "MMM d, yyyy");
}

export function formatEmailDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffDays = differenceInDays(now, d);
  if (diffDays === 0) return format(d, "h:mm a");
  if (diffDays < 7) return format(d, "EEE h:mm a");
  return format(d, "MMM d");
}

export function getDateRange(range: "today" | "week" | "month"): { start: Date; end: Date } {
  const now = new Date();
  switch (range) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export function getRelativeTimeLabel(minutesAgo: number): string {
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
