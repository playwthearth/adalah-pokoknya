/** Parse an ISO date ("YYYY-MM-DD") as local midnight, avoiding timezone drift. */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return new Date(Number.NaN);
  return new Date(year, month - 1, day);
}

export function isValidISODate(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(parseISODate(iso).getTime());
}

export function formatDate(iso: string, locale: string): string {
  const date = parseISODate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(iso: string, locale: string): string {
  const date = parseISODate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatClock(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatLongDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatWeekday(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
}

/** Seconds → "3:07" */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/** Wall-clock readings in a named zone, independent of the device's own zone. */
export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** What a clock in `timeZone` reads at this instant. */
export function zonedParts(date: Date, timeZone: string): ZonedParts | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const [year, month, day, hour, minute, second] = [
      "year",
      "month",
      "day",
      "hour",
      "minute",
      "second",
    ].map(read);
    if ([year, month, day, hour, minute, second].some((value) => !Number.isFinite(value))) {
      return null;
    }
    return { year, month, day, hour, minute, second };
  } catch {
    return null;
  }
}

/** The civil date ("YYYY-MM-DD") an instant falls on in a named zone. */
export function zonedDateKey(date: Date, timeZone: string): string {
  const parts = zonedParts(date, timeZone);
  if (!parts) return date.toISOString().slice(0, 10);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

/**
 * A wall-clock reading as milliseconds, both sides treated as UTC, so two
 * readings can be subtracted without the device's own zone interfering.
 */
export function civilMs(parts: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
}

/** "14:05" as read in the shared zone. */
export function formatClockInZone(date: Date, locale: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return formatClock(date, locale).slice(0, 5);
  }
}

/** Whole days between two local midnights. */
export function daysBetween(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** Next occurrence of a month/day, excluding today. */
export function nextAnniversary(start: Date, now: Date): Date {
  const candidate = new Date(now.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (candidate.getTime() <= today.getTime()) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }
  return candidate;
}

export function greetingKey(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "night";
}
