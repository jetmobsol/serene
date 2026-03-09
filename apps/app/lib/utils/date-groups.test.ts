import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { groupEntriesByDate } from "./date-groups";

function makeEntry(date: Date) {
  return { createdAt: date, id: date.toISOString() };
}

// Wednesday, 2026-03-11 at 14:00 local time
const NOW = new Date(2026, 2, 11, 14, 0, 0);

describe("groupEntriesByDate", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty array for empty input", () => {
    expect(groupEntriesByDate([])).toEqual([]);
  });

  it("groups entries from today", () => {
    const entries = [
      makeEntry(new Date(2026, 2, 11, 10, 0)),
      makeEntry(new Date(2026, 2, 11, 8, 0)),
    ];
    const groups = groupEntriesByDate(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Today");
    expect(groups[0].entries).toHaveLength(2);
  });

  it("groups entries from yesterday", () => {
    const entries = [makeEntry(new Date(2026, 2, 10, 20, 0))];
    const groups = groupEntriesByDate(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Yesterday");
  });

  it("groups entries from this week (not today/yesterday)", () => {
    // 2026-03-11 is Wednesday. Monday = March 9.
    const entries = [makeEntry(new Date(2026, 2, 9, 12, 0))]; // Monday
    const groups = groupEntriesByDate(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("This Week");
  });

  it("groups entries from earlier weeks", () => {
    const entries = [makeEntry(new Date(2026, 2, 1, 12, 0))]; // March 1
    const groups = groupEntriesByDate(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Earlier");
  });

  it("groups mixed entries in correct order", () => {
    const entries = [
      makeEntry(new Date(2026, 2, 11, 12, 0)), // Today
      makeEntry(new Date(2026, 2, 10, 12, 0)), // Yesterday
      makeEntry(new Date(2026, 2, 9, 12, 0)), // This Week (Monday)
      makeEntry(new Date(2026, 1, 28, 12, 0)), // Earlier (Feb 28)
    ];
    const groups = groupEntriesByDate(entries);
    expect(groups).toHaveLength(4);
    expect(groups[0].label).toBe("Today");
    expect(groups[1].label).toBe("Yesterday");
    expect(groups[2].label).toBe("This Week");
    expect(groups[3].label).toBe("Earlier");
  });

  it("preserves entry order within groups", () => {
    const entry1 = makeEntry(new Date(2026, 2, 11, 12, 0));
    const entry2 = makeEntry(new Date(2026, 2, 11, 10, 0));
    const groups = groupEntriesByDate([entry1, entry2]);
    expect(groups[0].entries[0]).toBe(entry1);
    expect(groups[0].entries[1]).toBe(entry2);
  });

  it("omits empty groups", () => {
    const entries = [
      makeEntry(new Date(2026, 2, 11, 12, 0)), // Today
      makeEntry(new Date(2026, 1, 28, 12, 0)), // Earlier
    ];
    const groups = groupEntriesByDate(entries);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe("Today");
    expect(groups[1].label).toBe("Earlier");
  });
});
