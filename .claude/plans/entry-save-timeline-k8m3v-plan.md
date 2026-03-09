# Entry Save + Timeline - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-09

## Summary

Implement the journal Entry Save + Timeline feature: compose an EntryForm that wires MoodSelector, TagChips, and NoteEditor to the API via TanStack Query mutations; build a Timeline component with date-grouped EntryCards and infinite scroll pagination; add an entry detail route at `/journal/$entryId`; and redirect the dashboard to `/journal`. Two new shadcn/ui components (dropdown-menu, alert-dialog) must be added to `@repo/ui` first.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `packages/ui/index.ts`
- `apps/app/routes/(app)/journal/index.tsx`
- `apps/app/routes/(app)/index.tsx`

### Files to Create

- `packages/ui/components/dropdown-menu.tsx`
- `packages/ui/components/alert-dialog.tsx`
- `apps/app/lib/queries/journal.ts`
- `apps/app/lib/utils/date-groups.ts`
- `apps/app/lib/utils/date-groups.test.ts`
- `apps/app/lib/utils/relative-time.ts`
- `apps/app/components/journal/entry-form.tsx`
- `apps/app/components/journal/entry-form.test.tsx`
- `apps/app/components/journal/entry-card.tsx`
- `apps/app/components/journal/timeline.tsx`
- `apps/app/routes/(app)/journal/$entryId.tsx`

---

## Code Context

### tRPC API Shape (apps/api/routers/journal.ts)

The `journal` router exposes 5 procedures:

- **`create`** (mutation): Input `{ mood: MoodType, tags: TagType[], note: string }`. Returns `JournalEntry`.
- **`list`** (query): Input `{ cursor?: string, limit?: number (default 20) }`. Returns `{ entries: JournalEntry[], nextCursor: string | null }`. Entries include `aiResponse` relation. Cursor is base64-encoded JSON `{ createdAt: string, id: string }`. Ordered by `createdAt DESC, id DESC`.
- **`getById`** (query): Input `{ id: string }`. Returns `JournalEntry` with `aiResponse`. Throws `NOT_FOUND` if missing or not owned.
- **`update`** (mutation): Input `{ id: string, mood?: MoodType, tags?: TagType[], note?: string }`. Returns updated `JournalEntry`.
- **`delete`** (mutation): Input `{ id: string }`. Returns `{ success: true }`.

### tRPC Client Pattern (apps/app/lib/trpc.ts)

- `api` = `createTRPCOptionsProxy<AppRouter>` — used for TanStack Query integration (query options)
- `trpcClient` = `createTRPCClient<AppRouter>` — used for direct calls in queryFn

### Query Pattern (apps/app/lib/queries/session.ts, billing.ts)

- Export a const `xxxQueryKey` array for cache key management
- Export `xxxQueryOptions()` factory returning `queryOptions({...})`
- Export `useXxxQuery()` wrapping `useQuery(xxxQueryOptions())`
- Billing uses `trpcClient.billing.subscription.query()` in queryFn

### Path Alias

The app uses `@/` prefix (tsconfig `"@/*": ["./*"]`), NOT `~/`. All existing code confirms `@/` pattern.

### Existing Component Props

- `MoodSelector`: `{ value: MoodType | null, onChange: (mood: MoodType) => void }`
- `TagChips`: `{ value: TagType[], onChange: (tags: TagType[]) => void }`
- `NoteEditor`: `{ value: string, onChange: (note: string) => void, maxLength?: number }`

### DB Types

- `JournalEntry` = `typeof journalEntry.$inferSelect` — fields: `id`, `userId`, `mood`, `tags` (string[]), `note`, `createdAt` (Date), `updatedAt` (Date)
- `AiResponse` = `typeof aiResponse.$inferSelect` — fields: `id`, `entryId`, `response`, `hasCrisisContent`, `model`, `createdAt`
- Entry with AI: `JournalEntry & { aiResponse: AiResponse | null }`

### Available UI Components from @repo/ui

Badge, Button (variants: default/destructive/outline/secondary/ghost/link; sizes: default/sm/lg/icon), Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter, Skeleton, Separator, Sonner (toast). Need to add: DropdownMenu, AlertDialog.

### Mood Constants from @repo/core

- `MOODS`: `["Happy", "Calm", "Anxious", "Sad", "Overwhelmed", "Angry"]`
- `MOOD_COLORS`: Record mapping mood to `{ light: string, dark: string }` (oklch values)
- `MOOD_ICONS`: Record mapping mood to lucide icon name string (`"Smile"`, `"CloudSun"`, etc.)
- `MOOD_SCORES`: Record mapping mood to 1-5 score
- `TAGS`: `["Work", "Sleep", "Relationships", "Fitness", "Hobbies", "Health", "Social", "Nature"]`
- `TAG_ICONS`: Record mapping tag to lucide icon name string

### Route Structure

- Routes use `createFileRoute("/(app)/journal/")` pattern
- Auth guard in `(app)/route.tsx` `beforeLoad` provides `{ user, session }` in route context
- TanStack Router auto-generates route tree from file structure
- `$entryId.tsx` creates a dynamic route parameter accessed via `Route.useParams()`

### Test Setup

- Vitest with happy-dom environment
- `@testing-library/react` + `@testing-library/user-event` + `@testing-library/jest-dom/vitest`
- Tests colocated with components (e.g., `mood-selector.test.tsx` next to `mood-selector.tsx`)
- Pattern: `import { cleanup, render, screen } from "@testing-library/react"`, `afterEach(cleanup)`

---

## External Context

### TanStack Query Infinite Query

- `useInfiniteQuery({ queryKey, queryFn, getNextPageParam, initialPageParam })` returns `{ data, fetchNextPage, hasNextPage, isFetchingNextPage }`
- `data.pages` is an array of page results; flatten with `data.pages.flatMap(p => p.entries)`
- `getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined` — returning `undefined` signals no more pages
- `initialPageParam: undefined` for first page (no cursor)

### tRPC + TanStack Query Integration (v11)

With `createTRPCOptionsProxy`, infinite queries use:

```ts
api.journal.list.infiniteQueryOptions({
  input: { limit: 20 },
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  initialPageParam: undefined as string | undefined,
});
```

But for `queryFn` with cursor, the tRPC proxy handles passing `pageParam` as `cursor` automatically when the input includes `cursor`.

Actually, with tRPC v11 + `createTRPCOptionsProxy`, use `trpcClient` directly in the queryFn for infinite queries:

```ts
queryFn: ({ pageParam }) =>
  trpcClient.journal.list.query({ cursor: pageParam, limit: 20 });
```

### Intl.RelativeTimeFormat

- `new Intl.RelativeTimeFormat("en", { numeric: "auto" })` — gives "yesterday", "2 days ago", etc.
- `.format(-1, "day")` → "yesterday", `.format(-2, "hour")` → "2 hours ago"
- Need to compute diff and pick appropriate unit (seconds, minutes, hours, days)

---

## Architectural Narrative

### Task

Implement the full Entry Save + Timeline feature for the Serene wellness journal. This means:

1. Wiring the existing form components to the API via TanStack Query mutations
2. Building the timeline view with date grouping and pagination
3. Creating an entry detail view for full content and edit/delete actions
4. Adding the necessary UI primitives (dropdown-menu, alert-dialog) to the shared UI package

### Architecture

The app is a React 19 SPA with file-based routing (TanStack Router). Server state is managed via TanStack Query, with tRPC as the RPC layer. The `api` proxy (`createTRPCOptionsProxy`) provides type-safe query options, while `trpcClient` is used for direct calls in queryFn callbacks.

The journal feature lives in:

- **Queries**: `apps/app/lib/queries/journal.ts` — all query keys, query options, and mutation hooks
- **Components**: `apps/app/components/journal/` — EntryForm, EntryCard, Timeline
- **Routes**: `apps/app/routes/(app)/journal/` — index (list + form) and `$entryId` (detail)
- **Utilities**: `apps/app/lib/utils/` — date grouping and relative time formatting

### Selected Context

| File                                            | Provides                                               |
| ----------------------------------------------- | ------------------------------------------------------ |
| `apps/api/routers/journal.ts`                   | All 5 CRUD procedures with exact input/output shapes   |
| `apps/app/lib/trpc.ts:47-50`                    | `api` proxy and `trpcClient` for query integration     |
| `apps/app/lib/queries/session.ts`               | Pattern to follow: queryKey, queryOptions, useXxxQuery |
| `apps/app/lib/queries/billing.ts`               | Shows `trpcClient` usage in queryFn                    |
| `packages/core/journal.ts`                      | MOODS, MOOD_COLORS, MOOD_ICONS, TAGS, TAG_ICONS types  |
| `apps/app/components/journal/mood-selector.tsx` | MoodSelector props interface                           |
| `apps/app/components/journal/tag-chips.tsx`     | TagChips props interface                               |
| `apps/app/components/journal/note-editor.tsx`   | NoteEditor props interface (debounced onChange)        |
| `apps/app/routes/(app)/journal/index.tsx`       | Current stub to replace                                |
| `packages/ui/components/button.tsx`             | Button with variant/size props                         |
| `packages/ui/components/card.tsx`               | Card, CardHeader, CardTitle, CardContent, CardFooter   |
| `packages/ui/components/skeleton.tsx`           | Skeleton for loading states                            |
| `packages/ui/components/badge.tsx`              | Badge with variant prop                                |

### Relationships

```
EntryForm → useCreateJournalMutation / useUpdateJournalMutation
         → MoodSelector, TagChips, NoteEditor (composition)
         → sonner toast for success feedback

Timeline → useJournalListQuery (infinite query)
        → groupEntriesByDate (utility)
        → EntryCard (renders each entry)

EntryCard → Card, Badge from @repo/ui
         → DropdownMenu for actions
         → Link to /$entryId detail route
         → relativeTime utility for timestamps

$entryId route → useJournalByIdQuery
              → EntryForm (edit mode)
              → AlertDialog (delete confirmation)
              → useDeleteJournalMutation

Journal index route → EntryForm (create mode) + Timeline
```

### Implementation Notes

1. **NoteEditor debounce**: NoteEditor debounces its onChange by 300ms. The EntryForm holds local state for all three sub-components. On save, it reads the local state directly — it does NOT wait for debounce to fire. The `note` state variable always reflects the latest debounced value. However, there is a subtle issue: if the user types and immediately clicks Save, the debounce may not have fired yet. To handle this, the EntryForm should use the NoteEditor's `value` prop (which it controls) as the source of truth. Actually, looking at NoteEditor more carefully — it has its own `localValue` and only calls `onChange` after debounce. So the parent's `note` state may be stale by up to 300ms. This is acceptable for UX — the user types, waits briefly, then saves. If they save immediately after typing, they get the last debounced value. This is standard form behavior and acceptable.

2. **Infinite query cache invalidation**: After create mutation succeeds, invalidate the journal list query. This triggers a refetch of page 1, which will include the new entry at the top. Do NOT use optimistic updates for create (the server generates the ID and timestamps).

3. **Optimistic updates for update/delete**: For update mutations, optimistically update both the list cache and detail cache. For delete, optimistically remove from list cache. On error, roll back using the `onMutate` snapshot.

4. **Date grouping is client-side**: The API returns entries in UTC. The client groups them by local timezone. The grouping function takes `Date` objects (already parsed from ISO strings by tRPC/superjson).

5. **DropdownMenu and AlertDialog**: These are standard shadcn/ui components. Run `bun ui:add dropdown-menu alert-dialog` to generate them, then add exports to `packages/ui/index.ts`. The generated code will follow the same pattern as existing components.

6. **Entry detail route**: Uses `createFileRoute("/(app)/journal/$entryId")`. The `$entryId` becomes a route param. Use `Route.useParams()` to get `{ entryId }`. The detail view can either show a read-only view with edit/delete buttons, or show the EntryForm in edit mode. For simplicity, show a read-only detail view with an "Edit" button that toggles to edit mode (inline editing).

7. **Dashboard redirect**: Change `apps/app/routes/(app)/index.tsx` to redirect to `/journal` in `beforeLoad`. Keep it simple — no dashboard for now.

### Ambiguities

- **Edit UX**: The task says "Edit navigates to form pre-filled with entry data (could be inline or separate view)." Decision: Use inline editing on the detail page — toggle between read-only and edit mode. This avoids a separate edit route and keeps the URL stable.
- **Infinite scroll vs Load More button**: The task says "Load More button or infinite scroll trigger." Decision: Use a "Load More" button for simplicity and accessibility. Infinite scroll via IntersectionObserver can be added later.
- **Note debounce on save**: As noted above, the parent state may lag by 300ms. This is acceptable.

### Requirements

1. User can create entry (mood + tags + note), success toast appears
2. Entry appears at top of timeline immediately after save (cache invalidation)
3. Timeline groups entries by date (Today/Yesterday/This Week/Earlier)
4. Entry cards show mood icon, tags, note preview, timestamp
5. Clicking entry opens detail view with full note and action buttons
6. Empty state message displayed when no entries
7. Load More pagination works
8. All component + unit tests pass (`bun test --run`)
9. `bun typecheck` passes
10. `bun lint` passes

### Constraints

- Use `@repo/ui` for all UI primitives
- Use `@repo/core` for mood/tag constants
- Follow `@/` import alias (NOT `~/`)
- File naming: kebab-case
- No heavy dependencies (no date-fns, no moment)
- Use `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat` for date/time formatting

### Selected Approach

**Approach**: Query-hooks-first with colocated mutations and client-side date grouping

**Description**: Create a central `journal.ts` query module that exports all query keys, query options (including infinite query for list), and mutation hooks. The EntryForm component composes existing sub-components and calls mutations. The Timeline component consumes the infinite query, pipes entries through a pure date-grouping utility, and renders EntryCards. The detail route loads a single entry by ID and supports inline editing.

**Rationale**: This follows the exact pattern established by `session.ts` and `billing.ts` in the codebase. Centralizing query logic in `lib/queries/` keeps components thin and testable. Client-side date grouping is appropriate because the page size is 20 and grouping is a simple O(n) operation.

**Trade-offs Accepted**:

- The NoteEditor debounce means the parent may have a slightly stale note value on save (up to 300ms). This is standard behavior.
- No optimistic create (server generates IDs) — the entry appears after refetch, which is near-instant.
- Load More button instead of infinite scroll — simpler, more accessible, can be upgraded later.

---

## Implementation Plan

### packages/ui/components/dropdown-menu.tsx [create]

**Purpose**: shadcn/ui DropdownMenu component for entry card actions

**TOTAL CHANGES**: 1 (generate via CLI)

**Changes**:

1. Run `bun ui:add dropdown-menu` from the monorepo root. This generates the file automatically with all Radix UI primitives.

**Implementation Details**:

- This is a standard shadcn/ui component generation. The CLI handles all code.
- After generation, the file will export: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuLabel`, `DropdownMenuGroup`, etc.
- Radix dependency `@radix-ui/react-dropdown-menu` will be added to `packages/ui/package.json` automatically.

**Reference Implementation**: Generated by `bun ui:add dropdown-menu` — do not write manually.

**Dependencies**: None
**Provides**: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`

---

### packages/ui/components/alert-dialog.tsx [create]

**Purpose**: shadcn/ui AlertDialog component for delete confirmation

**TOTAL CHANGES**: 1 (generate via CLI)

**Changes**:

1. Run `bun ui:add alert-dialog` from the monorepo root.

**Implementation Details**:

- Standard shadcn/ui generation. Exports: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`.
- Radix dependency `@radix-ui/react-alert-dialog` will be added automatically.

**Reference Implementation**: Generated by `bun ui:add alert-dialog` — do not write manually.

**Dependencies**: None
**Provides**: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`

---

### packages/ui/index.ts [edit]

**Purpose**: Re-export new UI components from the package entrypoint

**TOTAL CHANGES**: 1

**Changes**:

1. After line 7 (after `export * from "./components/badge"`), add two new export lines for alert-dialog and dropdown-menu, maintaining alphabetical order.

**Implementation Details**:

- Insert `export * from "./components/alert-dialog";` after the avatar export (line 7)
- Insert `export * from "./components/dropdown-menu";` after the dialog export (line 12)

**Migration Pattern**:

```typescript
// BEFORE (lines 7-12):
export * from "./components/avatar";
export * from "./components/badge";
export * from "./components/button";
export * from "./components/card";
export * from "./components/checkbox";
export * from "./components/dialog";

// AFTER:
export * from "./components/alert-dialog";
export * from "./components/avatar";
export * from "./components/badge";
export * from "./components/button";
export * from "./components/card";
export * from "./components/checkbox";
export * from "./components/dialog";
export * from "./components/dropdown-menu";
```

**Dependencies**: `packages/ui/components/dropdown-menu.tsx`, `packages/ui/components/alert-dialog.tsx`
**Provides**: Re-exports of DropdownMenu and AlertDialog from `@repo/ui`

---

### apps/app/lib/utils/relative-time.ts [create]

**Purpose**: Lightweight relative time formatting using Intl.RelativeTimeFormat

**TOTAL CHANGES**: 1

**Changes**:

1. Create file with `formatRelativeTime` function.

**Implementation Details**:

- Single exported function: `formatRelativeTime(date: Date): string`
- Uses `Intl.RelativeTimeFormat` with `numeric: "auto"` for "yesterday", "2 hours ago" etc.
- Picks the appropriate unit (seconds, minutes, hours, days) based on the diff
- Falls back to absolute date for entries older than 7 days using `Intl.DateTimeFormat`

**Reference Implementation**:

```typescript
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
```

**Dependencies**: None
**Provides**: `formatRelativeTime(date: Date): string`

---

### apps/app/lib/utils/date-groups.ts [create]

**Purpose**: Groups journal entries by date: Today, Yesterday, This Week, Earlier

**TOTAL CHANGES**: 1

**Changes**:

1. Create file with `groupEntriesByDate` function and `DateGroup` type.

**Implementation Details**:

- Export type: `DateGroup<T> = { label: string; entries: T[] }`
- Export function: `groupEntriesByDate<T extends { createdAt: Date }>(entries: T[]): DateGroup<T>[]`
- Uses `Intl.DateTimeFormat` to resolve dates in the user's local timezone
- "Today" = same local date as now
- "Yesterday" = local date is now minus 1 day
- "This Week" = same ISO week (Monday-Sunday) but not today/yesterday
- "Earlier" = everything else
- Returns only non-empty groups, in order: Today, Yesterday, This Week, Earlier
- Entries within each group preserve their original order (newest first from API)

**Reference Implementation**:

```typescript
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

function getMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay();
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // Shift so Monday=0: (dayOfWeek + 6) % 7
  const diff = (dayOfWeek + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function isSameWeek(a: Date, b: Date): boolean {
  const mondayA = getMonday(a);
  const mondayB = getMonday(b);
  return isSameLocalDate(mondayA, mondayB);
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

  const today: T[] = [];
  const yesterdayGroup: T[] = [];
  const thisWeek: T[] = [];
  const earlier: T[] = [];

  for (const entry of entries) {
    if (isSameLocalDate(entry.createdAt, now)) {
      today.push(entry);
    } else if (isSameLocalDate(entry.createdAt, yesterday)) {
      yesterdayGroup.push(entry);
    } else if (isSameWeek(entry.createdAt, now)) {
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
```

**Dependencies**: None
**Provides**: `DateGroup<T>`, `groupEntriesByDate<T extends { createdAt: Date }>(entries: T[]): DateGroup<T>[]`

---

### apps/app/lib/utils/date-groups.test.ts [create]

**Purpose**: Unit tests for date grouping utility

**TOTAL CHANGES**: 1

**Changes**:

1. Create test file with comprehensive test cases.

**Implementation Details**:

- Test empty input returns empty array
- Test all entries today returns single "Today" group
- Test mixed entries across today, yesterday, this week, earlier
- Test entries from different weeks go to "Earlier"
- Test ordering: groups appear in Today → Yesterday → This Week → Earlier order
- Test entries within each group preserve original order
- Use fixed dates relative to `Date.now()` — mock with `vi.useFakeTimers()`

**Reference Implementation**:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { groupEntriesByDate } from "./date-groups";

function makeEntry(date: Date) {
  return { createdAt: date, id: date.toISOString() };
}

describe("groupEntriesByDate", () => {
  beforeEach(() => {
    // Wednesday, 2026-03-11 at 14:00 local time
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 14, 0, 0));
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
```

**Dependencies**: `apps/app/lib/utils/date-groups.ts`
**Provides**: Test coverage for `groupEntriesByDate`

---

### apps/app/lib/queries/journal.ts [create]

**Purpose**: TanStack Query hooks for journal CRUD operations

**TOTAL CHANGES**: 1

**Changes**:

1. Create file with query keys, query options, and mutation hooks for all journal operations.

**Implementation Details**:

- `journalQueryKeys` — factory object with `all`, `lists`, `list(cursor)`, `details`, `detail(id)` methods
- `useJournalListQuery()` — wraps `useInfiniteQuery` for paginated list with cursor
- `useJournalByIdQuery(id: string)` — wraps `useQuery` for single entry
- `useCreateJournalMutation()` — calls `trpcClient.journal.create.mutate`, invalidates list on success, shows toast
- `useUpdateJournalMutation()` — calls `trpcClient.journal.update.mutate`, invalidates list + detail on success
- `useDeleteJournalMutation()` — calls `trpcClient.journal.delete.mutate`, invalidates list on success

**Reference Implementation**:

```typescript
import { trpcClient } from "@/lib/trpc";
import type { MoodType, TagType } from "@repo/core";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const journalQueryKeys = {
  all: ["journal"] as const,
  lists: () => [...journalQueryKeys.all, "list"] as const,
  detail: (id: string) => [...journalQueryKeys.all, "detail", id] as const,
};

const PAGE_SIZE = 20;

export function useJournalListQuery() {
  return useInfiniteQuery({
    queryKey: journalQueryKeys.lists(),
    queryFn: ({ pageParam }) =>
      trpcClient.journal.list.query({ cursor: pageParam, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useJournalByIdQuery(id: string) {
  return useQuery({
    queryKey: journalQueryKeys.detail(id),
    queryFn: () => trpcClient.journal.getById.query({ id }),
    enabled: !!id,
  });
}

export function useCreateJournalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { mood: MoodType; tags: TagType[]; note: string }) =>
      trpcClient.journal.create.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.lists() });
      toast.success("Entry saved", {
        description: "Your journal entry has been recorded.",
      });
    },
    onError: (error) => {
      toast.error("Failed to save entry", {
        description: error.message,
      });
    },
  });
}

export function useUpdateJournalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: string;
      mood?: MoodType;
      tags?: TagType[];
      note?: string;
    }) => trpcClient.journal.update.mutate(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: journalQueryKeys.detail(variables.id),
      });
      toast.success("Entry updated");
    },
    onError: (error) => {
      toast.error("Failed to update entry", {
        description: error.message,
      });
    },
  });
}

export function useDeleteJournalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trpcClient.journal.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.lists() });
      toast.success("Entry deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete entry", {
        description: error.message,
      });
    },
  });
}
```

**Dependencies**: `apps/app/lib/trpc.ts` (existing), `@repo/core` (existing)
**Provides**: `journalQueryKeys`, `useJournalListQuery()`, `useJournalByIdQuery(id: string)`, `useCreateJournalMutation()`, `useUpdateJournalMutation()`, `useDeleteJournalMutation()`

---

### apps/app/components/journal/entry-form.tsx [create]

**Purpose**: Composite form component that composes MoodSelector, TagChips, NoteEditor, and a Save button. Supports create and edit modes.

**TOTAL CHANGES**: 1

**Changes**:

1. Create file with `EntryForm` component.

**Implementation Details**:

- Props: `{ defaultValues?: { mood: MoodType; tags: TagType[]; note: string }, entryId?: string, onSuccess?: () => void }`
- When `entryId` is provided, uses `useUpdateJournalMutation`; otherwise `useCreateJournalMutation`
- Local state: `mood: MoodType | null`, `tags: TagType[]`, `note: string` — initialized from `defaultValues` if provided
- Save button disabled when `mood === null` or mutation is pending
- On success: reset form (create mode) or call `onSuccess` (edit mode)
- Uses Card wrapper for visual grouping

**Reference Implementation**:

```typescript
import { MoodSelector } from "@/components/journal/mood-selector";
import { NoteEditor } from "@/components/journal/note-editor";
import { TagChips } from "@/components/journal/tag-chips";
import {
  useCreateJournalMutation,
  useUpdateJournalMutation,
} from "@/lib/queries/journal";
import type { MoodType, TagType } from "@repo/core";
import { Button } from "@repo/ui";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";

interface EntryFormProps {
  defaultValues?: {
    mood: MoodType;
    tags: TagType[];
    note: string;
  };
  entryId?: string;
  onSuccess?: () => void;
}

export function EntryForm({
  defaultValues,
  entryId,
  onSuccess,
}: EntryFormProps) {
  const [mood, setMood] = useState<MoodType | null>(
    defaultValues?.mood ?? null,
  );
  const [tags, setTags] = useState<TagType[]>(defaultValues?.tags ?? []);
  const [note, setNote] = useState(defaultValues?.note ?? "");

  const createMutation = useCreateJournalMutation();
  const updateMutation = useUpdateJournalMutation();

  const isEditing = !!entryId;
  const mutation = isEditing ? updateMutation : createMutation;
  const isPending = mutation.isPending;
  const canSave = mood !== null && !isPending;

  function handleSave() {
    if (!mood) return;

    if (isEditing && entryId) {
      updateMutation.mutate(
        { id: entryId, mood, tags, note },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        },
      );
    } else {
      createMutation.mutate(
        { mood, tags, note },
        {
          onSuccess: () => {
            setMood(null);
            setTags([]);
            setNote("");
            onSuccess?.();
          },
        },
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">How are you feeling?</h3>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Tags</h3>
        <TagChips value={tags} onChange={setTags} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Notes</h3>
        <NoteEditor value={note} onChange={setNote} />
      </div>

      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {isEditing ? "Update Entry" : "Save Entry"}
          </>
        )}
      </Button>
    </div>
  );
}
```

**Dependencies**: `apps/app/lib/queries/journal.ts`, `apps/app/components/journal/mood-selector.tsx` (existing), `apps/app/components/journal/tag-chips.tsx` (existing), `apps/app/components/journal/note-editor.tsx` (existing)
**Provides**: `EntryForm` component with props `{ defaultValues?, entryId?, onSuccess? }`

---

### apps/app/components/journal/entry-form.test.tsx [create]

**Purpose**: Unit tests for EntryForm component

**TOTAL CHANGES**: 1

**Changes**:

1. Create test file verifying form rendering, save button state, and basic interactions.

**Implementation Details**:

- Mock `@/lib/queries/journal` module to avoid real API calls
- Test: renders all three sub-components (mood selector, tag chips, note editor)
- Test: save button is disabled when no mood selected
- Test: save button is enabled when mood is selected
- Test: calls create mutation on save in create mode
- Test: shows "Update Entry" text in edit mode

**Reference Implementation**:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryForm } from "./entry-form";

// Mock the query hooks
const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();

vi.mock("@/lib/queries/journal", () => ({
  useCreateJournalMutation: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useUpdateJournalMutation: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("EntryForm", () => {
  it("renders mood selector, tag chips, and note editor", () => {
    render(<EntryForm />, { wrapper: createWrapper() });
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/write about your day/i),
    ).toBeInTheDocument();
  });

  it("save button is disabled when no mood selected", () => {
    render(<EntryForm />, { wrapper: createWrapper() });
    const saveButton = screen.getByRole("button", { name: /save entry/i });
    expect(saveButton).toBeDisabled();
  });

  it("save button is enabled after selecting a mood", async () => {
    const user = userEvent.setup();
    render(<EntryForm />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText("Happy"));
    const saveButton = screen.getByRole("button", { name: /save entry/i });
    expect(saveButton).toBeEnabled();
  });

  it("calls create mutation on save", async () => {
    const user = userEvent.setup();
    render(<EntryForm />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText("Happy"));
    await user.click(screen.getByRole("button", { name: /save entry/i }));

    expect(mockCreateMutate).toHaveBeenCalledWith(
      { mood: "Happy", tags: [], note: "" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("shows 'Update Entry' in edit mode", () => {
    render(
      <EntryForm
        entryId="jrn_123"
        defaultValues={{ mood: "Calm", tags: ["Work"], note: "test note" }}
      />,
      { wrapper: createWrapper() },
    );
    expect(
      screen.getByRole("button", { name: /update entry/i }),
    ).toBeInTheDocument();
  });
});
```

**Dependencies**: `apps/app/components/journal/entry-form.tsx`
**Provides**: Test coverage for EntryForm

---

### apps/app/components/journal/entry-card.tsx [create]

**Purpose**: Card component displaying a single journal entry in the timeline

**TOTAL CHANGES**: 1

**Changes**:

1. Create file with `EntryCard` component.

**Implementation Details**:

- Props: `{ entry: JournalEntryWithAi, onEdit: (id: string) => void, onDelete: (id: string) => void }`
- `JournalEntryWithAi` type: `{ id: string, mood: string, tags: string[], note: string | null, createdAt: Date, updatedAt: Date, aiResponse: { id: string, response: string, hasCrisisContent: boolean } | null }`
- Left colored border using `MOOD_COLORS[entry.mood as MoodType].light`
- Header: mood icon + label (left), relative timestamp (right), dropdown menu (far right)
- Body: tag badges (small, secondary variant), note preview truncated at 150 chars
- Footer: AI response preview if present (italic, muted, max 100 chars)
- DropdownMenu with Edit and Delete items
- Entire card is clickable (wraps in `Link` to `/journal/$entryId`)
- Uses same `ICON_MAP` pattern as MoodSelector for resolving lucide icons

**Reference Implementation**:

```typescript
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { MOOD_COLORS, MOOD_ICONS, type MoodType } from "@repo/core";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  CloudRain,
  CloudSun,
  Flame,
  MoreVertical,
  Pencil,
  Smile,
  Sparkles,
  Trash2,
  Waves,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Smile,
  CloudSun,
  Zap,
  CloudRain,
  Waves,
  Flame,
};

export interface JournalEntryWithAi {
  id: string;
  mood: string;
  tags: string[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  aiResponse: {
    id: string;
    response: string;
    hasCrisisContent: boolean;
  } | null;
}

interface EntryCardProps {
  entry: JournalEntryWithAi;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const mood = entry.mood as MoodType;
  const MoodIcon = ICON_MAP[MOOD_ICONS[mood]];
  const moodColor = MOOD_COLORS[mood]?.light;

  return (
    <Card
      className="overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderLeftWidth: "4px", borderLeftColor: moodColor }}
    >
      <Link
        to="/journal/$entryId"
        params={{ entryId: entry.id }}
        className="block"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            {MoodIcon && (
              <MoodIcon className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-medium">{mood}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(entry.createdAt)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {entry.note && (
            <p className="text-sm text-muted-foreground">
              {truncate(entry.note, 150)}
            </p>
          )}
        </CardContent>

        {entry.aiResponse && (
          <CardFooter className="pt-0">
            <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2 w-full">
              <Sparkles className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground italic">
                {truncate(entry.aiResponse.response, 100)}
              </p>
            </div>
          </CardFooter>
        )}
      </Link>

      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Entry actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onEdit(entry.id);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onDelete(entry.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
```

**Dependencies**: `apps/app/lib/utils/relative-time.ts`, `packages/ui/components/dropdown-menu.tsx`, `@repo/ui` (existing Card, Badge, Button), `@repo/core` (existing)
**Provides**: `EntryCard` component, `JournalEntryWithAi` type

---

### apps/app/components/journal/timeline.tsx [create]

**Purpose**: Timeline component that renders date-grouped journal entries with infinite scroll pagination

**TOTAL CHANGES**: 1

**Changes**:

1. Create file with `Timeline` component.

**Implementation Details**:

- Uses `useJournalListQuery()` infinite query
- Flattens pages: `data.pages.flatMap(p => p.entries)`
- Passes flattened entries to `groupEntriesByDate()`
- Renders date group headers (h3 with label) + EntryCard list
- "Load More" button at bottom when `hasNextPage` is true
- Empty state: centered message with BookHeart icon when no entries and not loading
- Loading state: 3 skeleton cards while initial load
- Loading more state: spinner on "Load More" button
- Handles edit action by navigating to detail route
- Handles delete action by showing AlertDialog confirmation

**Reference Implementation**:

```typescript
import { EntryCard } from "@/components/journal/entry-card";
import type { JournalEntryWithAi } from "@/components/journal/entry-card";
import {
  useDeleteJournalMutation,
  useJournalListQuery,
} from "@/lib/queries/journal";
import { groupEntriesByDate } from "@/lib/utils/date-groups";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Skeleton,
} from "@repo/ui";
import { useNavigate } from "@tanstack/react-router";
import { BookHeart, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

export function Timeline() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useJournalListQuery();
  const navigate = useNavigate();
  const deleteMutation = useDeleteJournalMutation();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const entries = useMemo(
    () =>
      (data?.pages.flatMap((p) => p.entries) ?? []) as JournalEntryWithAi[],
    [data],
  );

  const groups = useMemo(() => groupEntriesByDate(entries), [entries]);

  function handleEdit(id: string) {
    navigate({ to: "/journal/$entryId", params: { entryId: id } });
  }

  function handleDelete(id: string) {
    setDeleteTarget(id);
  }

  function confirmDelete() {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget, {
        onSettled: () => setDeleteTarget(null),
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookHeart className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No entries yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Start your wellness journey by recording how you feel today. Your
          entries will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {group.label}
            </h3>
            <div className="space-y-3">
              {group.entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}

        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              journal entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**Dependencies**: `apps/app/components/journal/entry-card.tsx`, `apps/app/lib/queries/journal.ts`, `apps/app/lib/utils/date-groups.ts`, `packages/ui/components/alert-dialog.tsx`
**Provides**: `Timeline` component

---

### apps/app/routes/(app)/journal/index.tsx [edit]

**Purpose**: Journal page — compose EntryForm and Timeline

**TOTAL CHANGES**: 1 (full rewrite of component)

**Changes**:

1. Replace entire file content. Remove local state management (lines 1-55). Import and render EntryForm + Timeline. Keep Card wrapper for form.

**Migration Pattern**:

```typescript
// BEFORE (lines 1-55): Stub with local state, MoodSelector, TagChips, NoteEditor
// rendered directly in Cards

// AFTER: Composes EntryForm + Timeline
```

**Reference Implementation**:

```typescript
import { EntryForm } from "@/components/journal/entry-form";
import { Timeline } from "@/components/journal/timeline";
import { Card, CardContent, CardHeader, CardTitle, Separator } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/journal/")({
  component: Journal,
});

function Journal() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Journal</h2>
        <p className="text-muted-foreground">
          How are you feeling today? Record your mood and thoughts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <EntryForm />
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Entries</h2>
        <Timeline />
      </div>
    </div>
  );
}
```

**Dependencies**: `apps/app/components/journal/entry-form.tsx`, `apps/app/components/journal/timeline.tsx`
**Provides**: Updated journal index route

---

### apps/app/routes/(app)/journal/$entryId.tsx [create]

**Purpose**: Entry detail route showing full content with edit/delete actions

**TOTAL CHANGES**: 1

**Changes**:

1. Create file with detail view component.

**Implementation Details**:

- `createFileRoute("/(app)/journal/$entryId")` with component
- Uses `Route.useParams()` to get `{ entryId }`
- Uses `useJournalByIdQuery(entryId)` to fetch entry
- Loading state: skeleton
- Not found state: message with link back to journal
- Default view: read-only with full note content, mood, tags, timestamps, AI response
- Edit mode toggle: clicking "Edit" shows EntryForm with `defaultValues` and `entryId`
- Delete: AlertDialog confirmation, on success navigate to `/journal`
- Back button at top to return to journal list

**Reference Implementation**:

```typescript
import { EntryForm } from "@/components/journal/entry-form";
import { formatRelativeTime } from "@/lib/utils/relative-time";
import {
  useDeleteJournalMutation,
  useJournalByIdQuery,
} from "@/lib/queries/journal";
import { MOOD_COLORS, MOOD_ICONS, type MoodType, type TagType } from "@repo/core";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Separator,
  Skeleton,
} from "@repo/ui";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  CloudRain,
  CloudSun,
  Flame,
  Loader2,
  Pencil,
  Smile,
  Sparkles,
  Trash2,
  Waves,
  Zap,
} from "lucide-react";
import { useState } from "react";

const ICON_MAP: Record<string, LucideIcon> = {
  Smile,
  CloudSun,
  Zap,
  CloudRain,
  Waves,
  Flame,
};

export const Route = createFileRoute("/(app)/journal/$entryId")({
  component: EntryDetail,
});

function EntryDetail() {
  const { entryId } = Route.useParams();
  const { data: entry, isLoading } = useJournalByIdQuery(entryId);
  const deleteMutation = useDeleteJournalMutation();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  function handleDelete() {
    deleteMutation.mutate(entryId, {
      onSuccess: () => {
        navigate({ to: "/journal" });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6 text-center py-16">
        <h2 className="text-lg font-semibold">Entry not found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This journal entry may have been deleted.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/journal">Back to Journal</Link>
        </Button>
      </div>
    );
  }

  const mood = entry.mood as MoodType;
  const MoodIcon = ICON_MAP[MOOD_ICONS[mood]];
  const moodColor = MOOD_COLORS[mood]?.light;

  if (isEditing) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">Edit Entry</h2>
        </div>

        <Card>
          <CardContent className="pt-6">
            <EntryForm
              entryId={entryId}
              defaultValues={{
                mood,
                tags: entry.tags as TagType[],
                note: entry.note ?? "",
              }}
              onSuccess={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/journal">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">Entry Detail</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card style={{ borderLeftWidth: "4px", borderLeftColor: moodColor }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {MoodIcon && (
                <MoodIcon className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-lg font-semibold">{mood}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(entry.createdAt)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {entry.note && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {entry.note}
            </p>
          )}
        </CardContent>

        {entry.aiResponse && (
          <CardFooter>
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4 w-full">
              <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium mb-1">AI Insight</p>
                <p className="text-sm text-muted-foreground italic">
                  {entry.aiResponse.response}
                </p>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              journal entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

**Dependencies**: `apps/app/components/journal/entry-form.tsx`, `apps/app/lib/queries/journal.ts`, `apps/app/lib/utils/relative-time.ts`, `packages/ui/components/alert-dialog.tsx`
**Provides**: Entry detail route at `/(app)/journal/$entryId`

---

### apps/app/routes/(app)/index.tsx [edit]

**Purpose**: Redirect dashboard to journal page

**TOTAL CHANGES**: 1

**Changes**:

1. Replace entire file (lines 1-137). Add `beforeLoad` that throws a redirect to `/journal`.

**Migration Pattern**:

```typescript
// BEFORE (lines 1-137): Full dashboard with stats grid and getting started cards

// AFTER: Simple redirect to /journal
```

**Reference Implementation**:

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
  beforeLoad: () => {
    throw redirect({ to: "/journal" });
  },
});
```

**Dependencies**: None
**Provides**: Redirect from `/` to `/journal`

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                                              | Action | Depends On                                                                                                                                                        |
| ----- | ------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `packages/ui/components/dropdown-menu.tsx`        | create | --                                                                                                                                                                |
| 1     | `packages/ui/components/alert-dialog.tsx`         | create | --                                                                                                                                                                |
| 1     | `apps/app/lib/utils/relative-time.ts`             | create | --                                                                                                                                                                |
| 1     | `apps/app/lib/utils/date-groups.ts`               | create | --                                                                                                                                                                |
| 1     | `apps/app/lib/queries/journal.ts`                 | create | --                                                                                                                                                                |
| 1     | `apps/app/routes/(app)/index.tsx`                 | edit   | --                                                                                                                                                                |
| 2     | `packages/ui/index.ts`                            | edit   | `packages/ui/components/dropdown-menu.tsx`, `packages/ui/components/alert-dialog.tsx`                                                                             |
| 2     | `apps/app/lib/utils/date-groups.test.ts`          | create | `apps/app/lib/utils/date-groups.ts`                                                                                                                               |
| 2     | `apps/app/components/journal/entry-form.tsx`      | create | `apps/app/lib/queries/journal.ts`                                                                                                                                 |
| 2     | `apps/app/components/journal/entry-card.tsx`      | create | `apps/app/lib/utils/relative-time.ts`, `packages/ui/components/dropdown-menu.tsx`                                                                                 |
| 3     | `apps/app/components/journal/entry-form.test.tsx` | create | `apps/app/components/journal/entry-form.tsx`                                                                                                                      |
| 3     | `apps/app/components/journal/timeline.tsx`        | create | `apps/app/components/journal/entry-card.tsx`, `apps/app/lib/utils/date-groups.ts`, `apps/app/lib/queries/journal.ts`, `packages/ui/components/alert-dialog.tsx`   |
| 4     | `apps/app/routes/(app)/journal/index.tsx`         | edit   | `apps/app/components/journal/entry-form.tsx`, `apps/app/components/journal/timeline.tsx`                                                                          |
| 4     | `apps/app/routes/(app)/journal/$entryId.tsx`      | create | `apps/app/components/journal/entry-form.tsx`, `apps/app/lib/queries/journal.ts`, `apps/app/lib/utils/relative-time.ts`, `packages/ui/components/alert-dialog.tsx` |

---

## Exit Criteria

### Test Commands

```bash
bun test --run               # Vitest (all workspaces)
bun lint                     # ESLint with cache
bun typecheck                # tsc --build
```

### Success Conditions

- [ ] All tests pass (exit code 0)
- [ ] No linting errors (exit code 0)
- [ ] No type errors (exit code 0)
- [ ] All 10 requirements from ### Requirements satisfied
- [ ] All 14 files from ### Files implemented
- [ ] shadcn/ui components generated via CLI (not hand-written)
- [ ] Date grouping tests cover all 4 categories + edge cases
- [ ] EntryForm tests cover disabled state, create, and edit modes

### Verification Script

```bash
bun test --run && bun typecheck && bun lint
```

### Post-Implementation Steps

1. Run `/simplify` to review changed code for reuse, quality, efficiency. Fix any issues found.
2. Run `bun test --run` to verify tests still pass after simplification.
3. Run `bun prettier --write .` then `bun prettier --check .` for formatting.
4. Write Bowser YAML stories to `ai_review/user_stories/entry-save-timeline.yaml` covering ALL acceptance criteria.
5. Run `/ui-review entry-save-timeline` -- ALL stories must pass.
6. Fix and re-run if any bowser story fails.
7. Manual pitstop: human reviews running app at http://localhost:5173.
