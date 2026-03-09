import { describe, expect, it } from "vitest";
import { groupEntriesByDate } from "./date-groups";

function makeEntry(date: Date) {
  return { createdAt: date, id: date.toISOString() };
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

describe("groupEntriesByDate", () => {
  it("returns empty array for empty input", () => {
    expect(groupEntriesByDate([])).toEqual([]);
  });

  it("groups entries created today", () => {
    const entries = [makeEntry(hoursAgo(1)), makeEntry(hoursAgo(2))];
    const groups = groupEntriesByDate(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Today");
    expect(groups[0].entries).toHaveLength(2);
  });

  it("groups old entries as Earlier", () => {
    const entries = [makeEntry(daysAgo(30))];
    const groups = groupEntriesByDate(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Earlier");
  });

  it("preserves entry order within groups", () => {
    const first = makeEntry(hoursAgo(1));
    const second = makeEntry(hoursAgo(2));
    const groups = groupEntriesByDate([first, second]);
    expect(groups[0].entries[0]).toBe(first);
    expect(groups[0].entries[1]).toBe(second);
  });

  it("omits empty groups", () => {
    const entries = [makeEntry(daysAgo(30))];
    const groups = groupEntriesByDate(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Earlier");
  });
});
