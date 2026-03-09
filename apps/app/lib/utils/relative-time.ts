const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const dtf = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffSeconds = Math.round((date.getTime() - now) / 1000);
  const absDiff = Math.abs(diffSeconds);

  if (absDiff < MINUTE) {
    return rtf.format(diffSeconds, "second");
  }
  if (absDiff < HOUR) {
    return rtf.format(Math.round(diffSeconds / MINUTE), "minute");
  }
  if (absDiff < DAY) {
    return rtf.format(Math.round(diffSeconds / HOUR), "hour");
  }
  if (absDiff < 7 * DAY) {
    return rtf.format(Math.round(diffSeconds / DAY), "day");
  }

  return dtf.format(date);
}
