export interface DateGroup<T> {
  label: string;
  entries: T[];
}

function getLocalDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function isSameLocalDate(a: Date, b: Date): boolean {
  const pa = getLocalDateParts(a);
  const pb = getLocalDateParts(b);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

export function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay();
  const diff = (dayOfWeek + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function groupEntriesByDate<T extends { createdAt: Date }>(
  entries: T[],
): DateGroup<T>[] {
  const now = new Date();
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  );
  const thisMonday = getMonday(now);

  const today: T[] = [];
  const yesterdayGroup: T[] = [];
  const thisWeek: T[] = [];
  const earlier: T[] = [];

  for (const entry of entries) {
    if (isSameLocalDate(entry.createdAt, now)) {
      today.push(entry);
    } else if (isSameLocalDate(entry.createdAt, yesterday)) {
      yesterdayGroup.push(entry);
    } else if (isSameLocalDate(getMonday(entry.createdAt), thisMonday)) {
      thisWeek.push(entry);
    } else {
      earlier.push(entry);
    }
  }

  const groups: DateGroup<T>[] = [];

  if (today.length > 0) {
    groups.push({ label: "Today", entries: today });
  }
  if (yesterdayGroup.length > 0) {
    groups.push({ label: "Yesterday", entries: yesterdayGroup });
  }
  if (thisWeek.length > 0) {
    groups.push({ label: "This Week", entries: thisWeek });
  }
  if (earlier.length > 0) {
    groups.push({ label: "Earlier", entries: earlier });
  }

  return groups;
}
