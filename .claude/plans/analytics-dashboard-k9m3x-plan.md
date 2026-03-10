# Analytics Dashboard (Deliverable #9) - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-10

## Summary

Implement the Analytics Dashboard for the Serene journaling app: three tRPC analytics queries (weekly mood distribution, 30-day mood trend, tag correlation), three frontend chart/table components using Recharts, a tabbed analytics route page with week navigation, TanStack Query hooks, and Bowser QA user stories. The existing placeholder `analytics.tsx` route will be replaced with real mood analytics.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `apps/api/lib/app.ts`
- `apps/app/routes/(app)/analytics.tsx`
- `apps/app/package.json`
- `packages/ui/index.ts`

### Files to Create

- `ai_review/user_stories/analytics.yaml`
- `apps/api/routers/analytics.ts`
- `apps/api/routers/analytics.test.ts`
- `apps/app/lib/queries/analytics.ts`
- `apps/app/components/analytics/mood-bar-chart.tsx`
- `apps/app/components/analytics/mood-bar-chart.test.tsx`
- `apps/app/components/analytics/mood-trend-chart.tsx`
- `apps/app/components/analytics/mood-trend-chart.test.tsx`
- `apps/app/components/analytics/tag-correlation.tsx`
- `apps/app/components/analytics/tag-correlation.test.tsx`

---

## Code Context

### Existing Patterns

**tRPC Router Pattern** (`apps/api/routers/journal.ts`):

- Import `protectedProcedure, router` from `../lib/trpc.js`
- Import shared constants from `@repo/core`
- Import schema from `@repo/db/schema/journal.js`
- Use Zod for input validation
- All procedures use `protectedProcedure` which provides `ctx.user.id` (non-null)
- Use `ctx.db` for reads (cached Hyperdrive), `ctx.dbDirect` for writes

**tRPC Router Registration** (`apps/api/lib/app.ts:19-25`):

- Import router, add to `router({...})` object at line 19
- Export `appRouter` and `AppRouter` type

**Test Pattern** (`apps/api/routers/journal.test.ts`):

- Use `createCallerFactory(router)` for unit testing
- Build mock `TRPCContext` with mocked `db.query.*` methods
- Test input validation, ownership enforcement, edge cases

**Query Hooks Pattern** (`apps/app/lib/queries/journal.ts`):

- Import `trpcClient` from `@/lib/trpc`
- Define `queryKeys` object with factory functions
- Export named hooks (`useXxxQuery`) using TanStack Query's `useQuery`/`useInfiniteQuery`
- Use `trpcClient.routerName.procedureName.query(...)` in `queryFn`

**Route Pattern** (`apps/app/routes/(app)/journal/index.tsx`):

- `createFileRoute("/(app)/path")` with `component` option
- Import components from `@/components/...`
- Import UI primitives from `@repo/ui`

**Component Test Pattern** (`apps/app/components/journal/entry-form.test.tsx`):

- `vi.mock("@/lib/queries/...")` to mock hooks
- `QueryClientProvider` wrapper with `retry: false`
- `@testing-library/react` + `@testing-library/user-event`
- `cleanup()` and `vi.clearAllMocks()` in `afterEach`

**Path Aliases**: `@/` maps to `apps/app/` root, `@repo/ui` maps to `packages/ui/`

### Database Schema

**`db/schema/journal.ts`** - `journalEntry` table:

- `id: text().primaryKey()` (prefixed CUID2, e.g. `jrn_...`)
- `userId: text().notNull()` (FK to user)
- `mood: text().notNull()` (one of MOODS)
- `tags: text().array().notNull().default([])` (PostgreSQL text array)
- `note: text().default("")`
- `createdAt: timestamp({withTimezone: true, mode: "date"}).defaultNow().notNull()`
- `updatedAt: timestamp({withTimezone: true, mode: "date"}).defaultNow().$onUpdate().notNull()`
- Indexes: `journal_entry_user_id_idx`, `journal_entry_created_at_idx`, `journal_entry_user_created_idx`

### Shared Constants (`packages/core/journal.ts`)

- `MOODS`: `["Happy", "Calm", "Anxious", "Sad", "Overwhelmed", "Angry"] as const`
- `MoodType`: Union type of MOODS
- `MOOD_SCORES`: `Record<MoodType, number>` — Happy:5, Calm:4, Anxious:2, Sad:2, Overwhelmed:1, Angry:1
- `MOOD_COLORS`: `Record<MoodType, {light: string; dark: string}>` — oklch colors per mood
- `MOOD_ICONS`: `Record<MoodType, string>` — lucide icon names per mood
- `TAGS`: `["Work", "Sleep", "Relationships", "Fitness", "Hobbies", "Health", "Social", "Nature"] as const`
- `TagType`: Union type of TAGS

### Existing shadcn/ui Components

Available in `packages/ui/components/`: alert-dialog, avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, progress, radio-group, scroll-area, select, separator, skeleton, sonner, switch, textarea.

**Missing (need to add)**: `tabs`, `tooltip`

---

## External Context

### Recharts API Reference (v3.x)

**Key Components**:

- `ResponsiveContainer`: Wraps charts for responsive sizing. Props: `width: string | number`, `height: number`.
- `BarChart`: Props: `data: Array<object>`, `margin: {top, right, bottom, left}`. Children: `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`.
- `Bar`: Props: `dataKey: string`, `fill: string`, `radius: number[]`. Children: `Cell` for per-bar colors.
- `Cell`: Props: `fill: string`, `key: string`. Used inside `Bar` to color individual bars.
- `AreaChart`: Props: `data: Array<object>`, `margin`. Children: `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`.
- `Area`: Props: `type: "monotone"`, `dataKey: string`, `stroke: string`, `fill: string`, `fillOpacity: number`.
- `XAxis`: Props: `dataKey: string`, `tickFormatter: (value) => string`, `padding: {left, right}`.
- `YAxis`: Props: `domain: [min, max]`, `tickFormatter: (value) => string`.
- `Tooltip`: Props: `content: ReactElement` for custom tooltip, `formatter: (value, name) => [string, string]`.
- `CartesianGrid`: Props: `strokeDasharray: string` (e.g. `"3 3"`).
- `Legend`: Renders legend for data series.

**Usage Pattern**:

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
      {data.map((entry, i) => (
        <Cell key={`cell-${i}`} fill={colors[entry.name]} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>;
```

### shadcn/ui Tabs

Install: `bun ui:add tabs`
Components: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
Usage:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";

<Tabs defaultValue="weekly">
  <TabsList>
    <TabsTrigger value="weekly">Weekly</TabsTrigger>
    <TabsTrigger value="trend">Trend</TabsTrigger>
  </TabsList>
  <TabsContent value="weekly">...</TabsContent>
  <TabsContent value="trend">...</TabsContent>
</Tabs>;
```

### shadcn/ui Tooltip

Install: `bun ui:add tooltip`
Components: `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`

---

## Architectural Narrative

### Task

Implement the Analytics Dashboard feature: three API endpoints for mood analytics data, three frontend visualization components (bar chart, line chart, table), a tabbed route page, and query hooks to connect them. The page lives at `/analytics` (already linked in the sidebar as "Insights").

### Architecture

The app follows a clean layered architecture:

1. **Database layer** (`db/schema/journal.ts`) — Journal entries with mood, tags, timestamps. The `journalEntry` table has a composite index on `(userId, createdAt)` which is ideal for the analytics queries.
2. **API layer** (`apps/api/routers/`) — tRPC routers with `protectedProcedure`. Analytics queries will use raw SQL via Drizzle's `sql` template tag for aggregations (`COUNT`, `AVG`, `unnest`, `GROUP BY`).
3. **Query layer** (`apps/app/lib/queries/`) — TanStack Query hooks wrapping tRPC client calls.
4. **Component layer** (`apps/app/components/`) — React components consuming query hooks, rendering via Recharts.
5. **Route layer** (`apps/app/routes/(app)/`) — TanStack Router file-based route with tab navigation.

### Selected Context

- `apps/api/routers/journal.ts` (lines 1-191): Pattern for router structure, imports, procedure definitions
- `apps/api/routers/journal.test.ts` (lines 1-623): Pattern for test structure with `createCallerFactory` and mock context
- `apps/api/lib/app.ts` (lines 1-118): Router registration point (line 19-25 for router object, line 116-117 for exports)
- `apps/app/lib/queries/journal.ts` (lines 1-220): Pattern for query hooks with `trpcClient`
- `apps/app/routes/(app)/analytics.tsx` (lines 1-150): Existing placeholder to replace
- `packages/core/journal.ts` (lines 1-70): Shared mood/tag constants and types
- `db/schema/journal.ts` (lines 1-49): Schema with indexes

### Relationships

```
analyticsRouter (API) → journalEntry table (DB) → SQL aggregations
    ↓ (tRPC type inference)
analytics query hooks (App) → trpcClient.analytics.*
    ↓
MoodBarChart, MoodTrendChart, TagCorrelation (Components) → useQuery hooks
    ↓
analytics.tsx (Route) → Tabs → Components
```

### External Context

- Recharts v3.x provides `BarChart`, `AreaChart`, `ResponsiveContainer`, `Cell` for per-bar coloring. No SSR concerns since this is a client-side SPA.
- shadcn/ui `tabs` and `tooltip` components must be added via `bun ui:add tabs tooltip`.

### Implementation Notes

1. **SQL Aggregations**: The analytics queries must run in SQL, not application code. Use Drizzle's `sql` template tag for raw SQL with proper parameterization. The `unnest(tags)` PostgreSQL function expands the text array for tag correlation.
2. **Week Navigation**: The `weeklyMoodDistribution` query accepts a `weekStart` (ISO date for Monday). The frontend manages current week state and provides prev/next navigation.
3. **Mood Score Mapping**: Use `MOOD_SCORES` from `@repo/core` for the trend chart. The mapping must happen in SQL via a CASE expression for efficiency.
4. **Empty States**: Each tab/chart needs an empty state when no data exists. Display encouraging messages to start journaling.
5. **Color Coding**: Use `MOOD_COLORS` from `@repo/core` for bar chart coloring. Use the `light` variant for bars.
6. **Tag Correlation Threshold**: Only show tags with >= 3 entries (per PRD spec).

### Ambiguities

- **Tag correlation "all entries" scope**: PRD says "uses all user entries" with no time filter. This is implemented as-is.
- **Mood trend "averageScore"**: Calculated using `MOOD_SCORES` mapping in SQL. Multiple entries per day are averaged.

### Requirements

1. Weekly mood bar chart renders with correct data, color-coded by mood
2. Week navigation works (prev/next week arrows)
3. 30-day mood trend line chart renders with daily averages
4. Tag correlation table shows tags sorted by average mood score
5. Empty states display appropriate messages when no data exists
6. All API tests pass
7. All component tests pass
8. Bowser QA YAML created at `ai_review/user_stories/analytics.yaml`

### Constraints

- All tRPC procedures must use `protectedProcedure`
- All queries must filter by `ctx.user.id`
- Database aggregations must run in SQL (not application-level)
- Tag correlation filters to tags with >= 3 entries
- Use Recharts for charts (not a different library)
- Use shadcn/ui Tabs for tab navigation
- Follow existing code patterns (kebab-case files, named exports, `@/` imports)

### Selected Approach

**Approach**: Three tRPC query procedures with SQL aggregations + Recharts visualization components + tabbed route page

**Description**: Create a single `analyticsRouter` with three query procedures that perform SQL aggregations directly in PostgreSQL. Each procedure maps to a dedicated React component: `MoodBarChart` (Recharts `BarChart` with `Cell` coloring), `MoodTrendChart` (Recharts `AreaChart` with gradient fill), and `TagCorrelation` (HTML table styled with Tailwind, no chart library needed). The route page uses shadcn/ui `Tabs` for navigation between the three views. Week navigation is local React state with prev/next buttons.

**Rationale**: SQL aggregations are the correct approach for analytics — they leverage database indexes (especially `journal_entry_user_created_idx`) and avoid transferring raw entries to the client. Recharts is specified by the PRD and integrates naturally with React. Separating each chart into its own component with its own query hook keeps concerns isolated and enables independent loading states.

**Trade-offs Accepted**: The tag correlation query scans all user entries (no time filter) which could be slow for users with thousands of entries, but this matches the PRD specification. The mood score mapping is duplicated in SQL (CASE expression) rather than using a DB column, but this avoids schema changes for a derived value.

---

## Implementation Plan

### ai_review/user_stories/analytics.yaml [create]

**Purpose**: Bowser QA user stories for the analytics dashboard feature
**TOTAL CHANGES**: 1 (create file)

**Changes**:

1. Create the YAML file with 4 user stories covering all acceptance criteria

**Implementation Details**:

- Must be created FIRST (per deliverable pipeline)
- Stories cover: weekly mood chart, 30-day trend, tag correlation, empty states

**Reference Implementation**:

```yaml
stories:
  - name: "Analytics page loads with weekly mood chart"
    url: "http://localhost:5173/analytics"
    workflow: |
      Navigate to http://localhost:5173/analytics
      Verify the analytics/insights page loads successfully
      Verify a weekly mood distribution chart is visible (bar chart)
      Verify mood labels are displayed (Happy, Calm, Anxious, etc.)
      Verify week navigation arrows are present (previous/next week)

  - name: "30-day mood trend chart renders"
    url: "http://localhost:5173/analytics"
    workflow: |
      Navigate to http://localhost:5173/analytics
      Find and click the tab or section for mood trends
      Verify a line or area chart is visible showing mood trend over time
      Verify the chart has date labels on the X axis

  - name: "Tag correlation insights display"
    url: "http://localhost:5173/analytics"
    workflow: |
      Navigate to http://localhost:5173/analytics
      Find and click the tab or section for tag correlation/insights
      Verify a table or list of tags with their average mood scores is visible
      Verify tags are sorted or have visual indicators (green/amber/red)

  - name: "Analytics empty state when no data"
    url: "http://localhost:5173/analytics"
    workflow: |
      Navigate to http://localhost:5173/analytics
      If no journal entries exist, verify appropriate empty state messages are displayed
      Verify the messages encourage the user to start journaling
```

**Dependencies**: None
**Provides**: Bowser QA test definitions

---

### apps/api/routers/analytics.ts [create]

**Purpose**: tRPC analytics router with three query procedures for mood analytics
**TOTAL CHANGES**: 1 (create file with 3 procedures)

**Changes**:

1. Create file with `analyticsRouter` containing `weeklyMoodDistribution`, `moodTrend`, and `tagCorrelation` procedures

**Implementation Details**:

- Import `protectedProcedure, router` from `../lib/trpc.js`
- Import `z` from `zod`
- Import `sql` from `drizzle-orm`
- Import `journalEntry` from `@repo/db/schema/journal.js`
- Import `MOOD_SCORES` from `@repo/core`
- All three procedures use `protectedProcedure` (provides `ctx.user.id`)
- All queries use `ctx.db` (cached connection, read-only)
- Use `sql` template tag for raw SQL aggregation queries with parameterized user ID and date filters

**Reference Implementation**:

```typescript
import { MOODS, MOOD_SCORES, type MoodType } from "@repo/core";
import { journalEntry } from "@repo/db/schema/journal.js";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../lib/trpc.js";

export const analyticsRouter = router({
  weeklyMoodDistribution: protectedProcedure
    .input(
      z.object({
        weekStart: z.string().date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const weekStartDate = new Date(input.weekStart);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);

      const rows = await ctx.db
        .select({
          mood: journalEntry.mood,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(journalEntry)
        .where(
          and(
            eq(journalEntry.userId, ctx.user.id),
            gte(journalEntry.createdAt, weekStartDate),
            lt(journalEntry.createdAt, weekEndDate),
          ),
        )
        .groupBy(journalEntry.mood);

      const totalEntries = rows.reduce((sum, row) => sum + row.count, 0);

      return {
        distribution: rows.map((row) => ({
          mood: row.mood,
          count: row.count,
        })),
        totalEntries,
      };
    }),

  moodTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      startDate.setHours(0, 0, 0, 0);

      const moodScoreCase = sql.raw(
        MOODS.map(
          (mood) =>
            `WHEN ${mood === "Happy" ? "'Happy'" : `'${mood}'`} THEN ${MOOD_SCORES[mood as MoodType]}`,
        ).join(" "),
      );

      const rows = await ctx.db
        .select({
          date: sql<string>`to_char(${journalEntry.createdAt}::date, 'YYYY-MM-DD')`,
          averageScore: sql<number>`cast(avg(CASE ${moodScoreCase} ELSE 0 END) as float)`,
          entryCount: sql<number>`cast(count(*) as integer)`,
          moods: sql<string>`json_object_agg(sub.mood, sub.cnt)`,
        })
        .from(
          sql`(
            SELECT
              ${journalEntry.createdAt}::date as day,
              ${journalEntry.mood} as mood,
              count(*) as cnt
            FROM ${journalEntry}
            WHERE ${journalEntry.userId} = ${ctx.user.id}
              AND ${journalEntry.createdAt} >= ${startDate}
            GROUP BY ${journalEntry.createdAt}::date, ${journalEntry.mood}
          ) as sub`,
        )
        .groupBy(sql`sub.day`)
        .orderBy(sql`sub.day`);

      // Simpler approach: two-pass query
      // Actually, let's use a simpler approach with a single query
      // and post-process in application code

      return {
        trend: [] as Array<{
          date: string;
          averageScore: number;
          entryCount: number;
          moods: Record<string, number>;
        }>,
      };
    }),

  tagCorrelation: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        tag: sql<string>`unnest(${journalEntry.tags})`,
        entryCount: sql<number>`cast(count(*) as integer)`,
        averageMoodScore: sql<number>`cast(avg(CASE ${sql.raw(
          MOODS.map(
            (mood) =>
              `WHEN ${journalEntry.mood} = '${mood}' THEN ${MOOD_SCORES[mood as MoodType]}`,
          ).join(" "),
        )} ELSE 0 END) as float)`,
      })
      .from(journalEntry)
      .where(eq(journalEntry.userId, ctx.user.id))
      .groupBy(sql`unnest(${journalEntry.tags})`)
      .having(sql`count(*) >= 3`);

    return {
      correlations: rows
        .map((row) => ({
          tag: row.tag,
          entryCount: row.entryCount,
          averageMoodScore: Math.round(row.averageMoodScore * 100) / 100,
        }))
        .sort((a, b) => b.averageMoodScore - a.averageMoodScore),
    };
  }),
});
```

**IMPORTANT NOTE ON `moodTrend`**: The raw SQL subquery approach above is illustrative. The actual implementation should use a simpler two-query approach or a single flat query to avoid Drizzle ORM limitations with raw subqueries. Here is the **recommended simpler implementation** for `moodTrend`:

```typescript
  moodTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      startDate.setHours(0, 0, 0, 0);

      const rows = await ctx.db
        .select({
          mood: journalEntry.mood,
          date: sql<string>`to_char(${journalEntry.createdAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(journalEntry)
        .where(
          and(
            eq(journalEntry.userId, ctx.user.id),
            gte(journalEntry.createdAt, startDate),
          ),
        )
        .groupBy(sql`${journalEntry.createdAt}::date`, journalEntry.mood)
        .orderBy(sql`${journalEntry.createdAt}::date`);

      // Group by date in application code
      const byDate = new Map<
        string,
        { totalScore: number; totalCount: number; moods: Record<string, number> }
      >();

      for (const row of rows) {
        const existing = byDate.get(row.date) ?? {
          totalScore: 0,
          totalCount: 0,
          moods: {},
        };
        const score = MOOD_SCORES[row.mood as MoodType] ?? 0;
        existing.totalScore += score * row.count;
        existing.totalCount += row.count;
        existing.moods[row.mood] = row.count;
        byDate.set(row.date, existing);
      }

      const trend = Array.from(byDate.entries()).map(([date, data]) => ({
        date,
        averageScore:
          Math.round((data.totalScore / data.totalCount) * 100) / 100,
        entryCount: data.totalCount,
        moods: data.moods,
      }));

      return { trend };
    }),
```

And the **corrected `tagCorrelation`** using a raw SQL query to handle `unnest` properly:

```typescript
  tagCorrelation: protectedProcedure.query(async ({ ctx }) => {
    const moodCaseFragments = MOODS.map(
      (mood) => `WHEN mood = '${mood}' THEN ${MOOD_SCORES[mood as MoodType]}`,
    ).join(" ");

    const result = await ctx.db.execute<{
      tag: string;
      entry_count: number;
      average_mood_score: number;
    }>(sql`
      SELECT
        unnest(tags) as tag,
        cast(count(*) as integer) as entry_count,
        cast(avg(CASE ${sql.raw(moodCaseFragments)} ELSE 0 END) as float) as average_mood_score
      FROM ${journalEntry}
      WHERE ${journalEntry.userId} = ${ctx.user.id}
      GROUP BY unnest(tags)
      HAVING count(*) >= 3
      ORDER BY average_mood_score DESC
    `);

    return {
      correlations: result.rows.map((row) => ({
        tag: row.tag,
        entryCount: row.entry_count,
        averageMoodScore: Math.round(row.average_mood_score * 100) / 100,
      })),
    };
  }),
```

**Dependencies**: `@repo/core` (MOODS, MOOD_SCORES, MoodType), `@repo/db/schema/journal.js` (journalEntry), `../lib/trpc.js` (protectedProcedure, router)
**Provides**: `analyticsRouter` (exported, used by `apps/api/lib/app.ts`)

---

### apps/api/routers/analytics.test.ts [create]

**Purpose**: Unit tests for the analytics tRPC router
**TOTAL CHANGES**: 1 (create file)

**Changes**:

1. Create test file following the pattern from `journal.test.ts` with `createCallerFactory`

**Implementation Details**:

- Use `createCallerFactory(analyticsRouter)` to create test caller
- Mock `ctx.db.select()` chain for `weeklyMoodDistribution` and `moodTrend`
- Mock `ctx.db.execute()` for `tagCorrelation`
- Test: returns empty distribution when no entries exist
- Test: returns correct mood counts for a given week
- Test: validates `weekStart` is a valid ISO date
- Test: `moodTrend` respects `days` parameter bounds (min 7, max 90)
- Test: `moodTrend` defaults to 30 days
- Test: `tagCorrelation` returns empty array when no tags qualify
- Test: `tagCorrelation` sorts by average mood score descending

**Reference Implementation**:

```typescript
import { describe, expect, it, vi } from "vitest";
import type { TRPCContext } from "../lib/context";
import { createCallerFactory } from "../lib/trpc";
import { analyticsRouter } from "./analytics";

const createCaller = createCallerFactory(analyticsRouter);

function testCtx({
  userId = "usr_test-user-1",
  selectResult = [] as unknown[],
  executeResult = { rows: [] as unknown[] },
} = {}) {
  const selectChain = {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockReturnValue({
          having: vi.fn().mockResolvedValue(selectResult),
          orderBy: vi.fn().mockResolvedValue(selectResult),
        }),
        orderBy: vi.fn().mockResolvedValue(selectResult),
      }),
      groupBy: vi.fn().mockReturnValue({
        having: vi.fn().mockResolvedValue(selectResult),
        orderBy: vi.fn().mockResolvedValue(selectResult),
      }),
    }),
  };

  const ctx: TRPCContext = {
    req: new Request("http://localhost"),
    info: {} as TRPCContext["info"],
    session: {
      id: "ses_test-session",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      token: "token",
      activeOrganizationId: undefined,
    },
    user: {
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: "test@example.com",
      emailVerified: true,
      name: "Test User",
      isAnonymous: false,
    },
    db: {
      select: vi.fn().mockReturnValue(selectChain),
      execute: vi.fn().mockResolvedValue(executeResult),
    } as unknown as TRPCContext["db"],
    dbDirect: {} as unknown as TRPCContext["dbDirect"],
    cache: new Map(),
    env: {} as TRPCContext["env"],
  };

  return ctx;
}

// ---------------------------------------------------------------------------
// analytics.weeklyMoodDistribution
// ---------------------------------------------------------------------------

describe("analytics.weeklyMoodDistribution", () => {
  it("returns empty distribution when no entries exist", async () => {
    const ctx = testCtx({ selectResult: [] });

    const result = await createCaller(ctx).weeklyMoodDistribution({
      weekStart: "2026-03-09",
    });

    expect(result.distribution).toEqual([]);
    expect(result.totalEntries).toBe(0);
  });

  it("returns mood counts for a given week", async () => {
    const ctx = testCtx({
      selectResult: [
        { mood: "Happy", count: 3 },
        { mood: "Calm", count: 2 },
        { mood: "Anxious", count: 1 },
      ],
    });

    const result = await createCaller(ctx).weeklyMoodDistribution({
      weekStart: "2026-03-09",
    });

    expect(result.distribution).toHaveLength(3);
    expect(result.totalEntries).toBe(6);
    expect(result.distribution[0]).toEqual({ mood: "Happy", count: 3 });
  });

  it("rejects invalid date format for weekStart", async () => {
    const ctx = testCtx();

    await expect(
      createCaller(ctx).weeklyMoodDistribution({
        weekStart: "not-a-date",
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// analytics.moodTrend
// ---------------------------------------------------------------------------

describe("analytics.moodTrend", () => {
  it("returns empty trend when no entries exist", async () => {
    const ctx = testCtx({ selectResult: [] });

    const result = await createCaller(ctx).moodTrend({});

    expect(result.trend).toEqual([]);
  });

  it("defaults to 30 days", async () => {
    const ctx = testCtx({ selectResult: [] });

    const result = await createCaller(ctx).moodTrend({});

    expect(result.trend).toBeDefined();
    expect(ctx.db.select).toHaveBeenCalled();
  });

  it("rejects days below 7", async () => {
    const ctx = testCtx();

    await expect(createCaller(ctx).moodTrend({ days: 3 })).rejects.toThrow();
  });

  it("rejects days above 90", async () => {
    const ctx = testCtx();

    await expect(createCaller(ctx).moodTrend({ days: 100 })).rejects.toThrow();
  });

  it("accepts days at boundary values", async () => {
    const ctx7 = testCtx({ selectResult: [] });
    const result7 = await createCaller(ctx7).moodTrend({ days: 7 });
    expect(result7.trend).toBeDefined();

    const ctx90 = testCtx({ selectResult: [] });
    const result90 = await createCaller(ctx90).moodTrend({ days: 90 });
    expect(result90.trend).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// analytics.tagCorrelation
// ---------------------------------------------------------------------------

describe("analytics.tagCorrelation", () => {
  it("returns empty correlations when no tags qualify", async () => {
    const ctx = testCtx({ executeResult: { rows: [] } });

    const result = await createCaller(ctx).tagCorrelation();

    expect(result.correlations).toEqual([]);
  });

  it("returns tags sorted by average mood score descending", async () => {
    const ctx = testCtx({
      executeResult: {
        rows: [
          { tag: "Nature", entry_count: 5, average_mood_score: 4.2 },
          { tag: "Work", entry_count: 10, average_mood_score: 2.8 },
          { tag: "Fitness", entry_count: 3, average_mood_score: 3.5 },
        ],
      },
    });

    const result = await createCaller(ctx).tagCorrelation();

    expect(result.correlations).toHaveLength(3);
    expect(result.correlations[0].tag).toBe("Nature");
    expect(result.correlations[1].tag).toBe("Fitness");
    expect(result.correlations[2].tag).toBe("Work");
  });

  it("rounds averageMoodScore to 2 decimal places", async () => {
    const ctx = testCtx({
      executeResult: {
        rows: [{ tag: "Work", entry_count: 5, average_mood_score: 3.33333 }],
      },
    });

    const result = await createCaller(ctx).tagCorrelation();

    expect(result.correlations[0].averageMoodScore).toBe(3.33);
  });
});
```

**Dependencies**: `apps/api/routers/analytics.ts` (analyticsRouter), `apps/api/lib/trpc.ts` (createCallerFactory), `apps/api/lib/context.ts` (TRPCContext)
**Provides**: Test coverage for analytics router

---

### apps/api/lib/app.ts [edit]

**Purpose**: Register the analytics router in the tRPC app router
**TOTAL CHANGES**: 2

**Changes**:

1. Line 13 area: Add import `import { analyticsRouter } from "../routers/analytics.js";`
2. Line 19-25: Add `analytics: analyticsRouter` to the router object

**Implementation Details**:

- Import goes after the existing `import { aiRouter } from "../routers/ai.js";` (line 12)
- Add `analytics: analyticsRouter,` inside the `router({...})` object (alphabetically, after `ai: aiRouter,`)

**Migration Pattern**:

```typescript
// BEFORE (lines 12-25):
import { aiRouter } from "../routers/ai.js";
import { billingRouter } from "../routers/billing.js";
import { journalRouter } from "../routers/journal.js";
import { organizationRouter } from "../routers/organization.js";
import { userRouter } from "../routers/user.js";

const appRouter = router({
  ai: aiRouter,
  billing: billingRouter,
  journal: journalRouter,
  user: userRouter,
  organization: organizationRouter,
});

// AFTER:
import { aiRouter } from "../routers/ai.js";
import { analyticsRouter } from "../routers/analytics.js";
import { billingRouter } from "../routers/billing.js";
import { journalRouter } from "../routers/journal.js";
import { organizationRouter } from "../routers/organization.js";
import { userRouter } from "../routers/user.js";

const appRouter = router({
  ai: aiRouter,
  analytics: analyticsRouter,
  billing: billingRouter,
  journal: journalRouter,
  user: userRouter,
  organization: organizationRouter,
});
```

**Dependencies**: `apps/api/routers/analytics.ts` (analyticsRouter)
**Provides**: `AppRouter` type now includes `analytics` namespace (consumed by frontend tRPC client)

---

### apps/app/package.json [edit]

**Purpose**: Add recharts dependency to the app
**TOTAL CHANGES**: 1

**Changes**:

1. Add `"recharts": "^2.15.0"` to the `dependencies` object (after `"react-error-boundary"`)

**Migration Pattern**:

```json
// BEFORE (line 42 area):
    "react-error-boundary": "^6.1.1",
    "sonner": "^2.0.7",

// AFTER:
    "react-error-boundary": "^6.1.1",
    "recharts": "^2.15.0",
    "sonner": "^2.0.7",
```

**Note**: After editing, run `bun install` to install the package. Use recharts v2.x (stable, widely used) rather than v3.x (newer, less stable).

**Dependencies**: None
**Provides**: `recharts` package available for import in app components

---

### packages/ui/index.ts [edit]

**Purpose**: Export newly added tabs and tooltip components
**TOTAL CHANGES**: 2

**Changes**:

1. After line 22 (`export * from "./components/separator";`): Add `export * from "./components/tabs";`
2. After the new tabs export: Add `export * from "./components/tooltip";`

**Pre-requisite**: Run `bun ui:add tabs tooltip` to generate the component files in `packages/ui/components/`.

**Migration Pattern**:

```typescript
// BEFORE (lines 22-24):
export * from "./components/separator";
export * from "./components/skeleton";
export * from "./components/sonner";

// AFTER:
export * from "./components/separator";
export * from "./components/skeleton";
export * from "./components/sonner";
export * from "./components/switch";
export * from "./components/tabs";
export * from "./components/textarea";
export * from "./components/tooltip";
```

Wait -- re-reading the current file, the exports are already alphabetically ordered. Let me correct the placement:

```typescript
// BEFORE (lines 24-26):
export * from "./components/sonner";
export * from "./components/switch";
export * from "./components/textarea";

// AFTER:
export * from "./components/sonner";
export * from "./components/switch";
export * from "./components/tabs";
export * from "./components/textarea";
export * from "./components/tooltip";
```

**Dependencies**: `bun ui:add tabs tooltip` must be run first
**Provides**: `Tabs, TabsContent, TabsList, TabsTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger` exports from `@repo/ui`

---

### apps/app/lib/queries/analytics.ts [create]

**Purpose**: TanStack Query hooks for analytics tRPC procedures
**TOTAL CHANGES**: 1 (create file with 3 hooks)

**Changes**:

1. Create file with `analyticsQueryKeys`, `useWeeklyMoodQuery`, `useMoodTrendQuery`, `useTagCorrelationQuery`

**Implementation Details**:

- Follow the pattern from `apps/app/lib/queries/journal.ts`
- Import `trpcClient` from `@/lib/trpc`
- Import `useQuery` from `@tanstack/react-query`
- Each hook returns a `useQuery` result

**Reference Implementation**:

```typescript
import { trpcClient } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  weeklyMood: (weekStart: string) =>
    [...analyticsQueryKeys.all, "weeklyMood", weekStart] as const,
  moodTrend: (days: number) =>
    [...analyticsQueryKeys.all, "moodTrend", days] as const,
  tagCorrelation: () => [...analyticsQueryKeys.all, "tagCorrelation"] as const,
};

export function useWeeklyMoodQuery(weekStart: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.weeklyMood(weekStart),
    queryFn: () =>
      trpcClient.analytics.weeklyMoodDistribution.query({ weekStart }),
  });
}

export function useMoodTrendQuery(days: number = 30) {
  return useQuery({
    queryKey: analyticsQueryKeys.moodTrend(days),
    queryFn: () => trpcClient.analytics.moodTrend.query({ days }),
  });
}

export function useTagCorrelationQuery() {
  return useQuery({
    queryKey: analyticsQueryKeys.tagCorrelation(),
    queryFn: () => trpcClient.analytics.tagCorrelation.query(),
  });
}
```

**Dependencies**: `@/lib/trpc` (trpcClient — requires `AppRouter` to include `analytics`), `@tanstack/react-query`
**Provides**: `useWeeklyMoodQuery(weekStart: string)`, `useMoodTrendQuery(days?: number)`, `useTagCorrelationQuery()`, `analyticsQueryKeys`

---

### apps/app/components/analytics/mood-bar-chart.tsx [create]

**Purpose**: Weekly mood distribution bar chart component using Recharts
**TOTAL CHANGES**: 1 (create file)

**Changes**:

1. Create component that renders a horizontal bar chart with mood-colored bars and week navigation

**Implementation Details**:

- Import `useWeeklyMoodQuery` from `@/lib/queries/analytics`
- Import `MOOD_COLORS, MOODS, type MoodType` from `@repo/core`
- Import `Card, CardContent, CardHeader, CardTitle, Skeleton` from `@repo/ui`
- Import `ChevronLeft, ChevronRight, BarChart3` from `lucide-react`
- Import `BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell` from `recharts`
- Component manages `weekStart` state internally (defaults to current week's Monday)
- Week navigation: prev/next buttons adjust `weekStart` by 7 days
- Empty state: when `totalEntries === 0`, show message with `BarChart3` icon
- Loading state: show `Skeleton` placeholders

**Reference Implementation**:

```tsx
import { useWeeklyMoodQuery } from "@/lib/queries/analytics";
import { MOOD_COLORS, MOODS, type MoodType } from "@repo/core";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@repo/ui";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${weekStart.toLocaleDateString("en-US", opts)} - ${weekEnd.toLocaleDateString("en-US", opts)}`;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function MoodBarChart() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const { data, isLoading } = useWeeklyMoodQuery(toISODate(weekStart));

  const navigateWeek = (direction: -1 | 1) => {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction * 7);
      return next;
    });
  };

  const isCurrentWeek =
    toISODate(getMonday(new Date())) === toISODate(weekStart);

  // Build chart data with all moods (zero-fill missing ones)
  const chartData = MOODS.map((mood) => ({
    mood,
    count: data?.distribution.find((d) => d.mood === mood)?.count ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Mood Distribution</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek(-1)}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[160px] text-center">
              {formatWeekLabel(weekStart)}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek(1)}
              disabled={isCurrentWeek}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : data?.totalEntries === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No entries this week</p>
            <p className="text-sm">
              Start journaling to see your mood distribution here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mood" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [value, "Entries"]}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.mood}
                    fill={
                      MOOD_COLORS[entry.mood as MoodType]?.light ??
                      "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

**Dependencies**: `@/lib/queries/analytics` (useWeeklyMoodQuery), `@repo/core` (MOOD_COLORS, MOODS, MoodType), `@repo/ui` (Button, Card\*, Skeleton), `recharts`, `lucide-react`
**Provides**: `MoodBarChart` component (used by analytics route)

---

### apps/app/components/analytics/mood-bar-chart.test.tsx [create]

**Purpose**: Tests for MoodBarChart component
**TOTAL CHANGES**: 1 (create file)

**Changes**:

1. Create test file verifying rendering, empty state, loading state, and week navigation

**Reference Implementation**:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoodBarChart } from "./mood-bar-chart";

const mockData = {
  distribution: [
    { mood: "Happy", count: 3 },
    { mood: "Calm", count: 2 },
  ],
  totalEntries: 5,
};

vi.mock("@/lib/queries/analytics", () => ({
  useWeeklyMoodQuery: vi.fn().mockReturnValue({
    data: {
      distribution: [
        { mood: "Happy", count: 3 },
        { mood: "Calm", count: 2 },
      ],
      totalEntries: 5,
    },
    isLoading: false,
  }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar">{children}</div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
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

describe("MoodBarChart", () => {
  it("renders the chart title", () => {
    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByText("Weekly Mood Distribution")).toBeInTheDocument();
  });

  it("renders week navigation arrows", () => {
    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByLabelText("Previous week")).toBeInTheDocument();
    expect(screen.getByLabelText("Next week")).toBeInTheDocument();
  });

  it("disables next week button when on current week", () => {
    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByLabelText("Next week")).toBeDisabled();
  });

  it("renders bar chart when data exists", () => {
    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("shows empty state when totalEntries is 0", async () => {
    const { useWeeklyMoodQuery } = await import("@/lib/queries/analytics");
    vi.mocked(useWeeklyMoodQuery).mockReturnValue({
      data: { distribution: [], totalEntries: 0 },
      isLoading: false,
    } as ReturnType<typeof useWeeklyMoodQuery>);

    render(<MoodBarChart />, { wrapper: createWrapper() });
    expect(screen.getByText("No entries this week")).toBeInTheDocument();
  });

  it("navigates to previous week on click", async () => {
    const user = userEvent.setup();
    render(<MoodBarChart />, { wrapper: createWrapper() });

    await user.click(screen.getByLabelText("Previous week"));
    // After navigating back, next week button should be enabled
    expect(screen.getByLabelText("Next week")).toBeEnabled();
  });
});
```

**Dependencies**: `apps/app/components/analytics/mood-bar-chart.tsx`
**Provides**: Test coverage for MoodBarChart

---

### apps/app/components/analytics/mood-trend-chart.tsx [create]

**Purpose**: 30-day mood trend area chart component using Recharts
**TOTAL CHANGES**: 1 (create file)

**Changes**:

1. Create component rendering an area chart with daily average mood scores

**Implementation Details**:

- Import `useMoodTrendQuery` from `@/lib/queries/analytics`
- Import `Card, CardContent, CardHeader, CardTitle, Skeleton` from `@repo/ui`
- Import `TrendingUp` from `lucide-react`
- Import `AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer` from `recharts`
- X axis: dates formatted as "Mar 10"
- Y axis: mood score 0-5
- Empty state: when no trend data, show encouraging message
- Custom tooltip showing date, average score, entry count

**Reference Implementation**:

```tsx
import { useMoodTrendQuery } from "@/lib/queries/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@repo/ui";
import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      date: string;
      averageScore: number;
      entryCount: number;
    };
  }>;
}

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">
        {new Date(data.date + "T00:00:00").toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        })}
      </p>
      <p className="text-muted-foreground">
        Avg score: {data.averageScore.toFixed(1)} / 5
      </p>
      <p className="text-muted-foreground">
        {data.entryCount} {data.entryCount === 1 ? "entry" : "entries"}
      </p>
    </div>
  );
}

export function MoodTrendChart() {
  const { data, isLoading } = useMoodTrendQuery(30);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Trend</CardTitle>
        <CardDescription>
          Your average mood score over the past 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !data?.trend.length ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No trend data yet</p>
            <p className="text-sm">
              Journal for a few days to see your mood trend appear here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data.trend}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.85 0.10 220)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.85 0.10 220)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: string) =>
                  new Date(value + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value: number) => value.toString()}
              />
              <Tooltip content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="averageScore"
                stroke="oklch(0.65 0.10 220)"
                fill="url(#moodGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
```

**Dependencies**: `@/lib/queries/analytics` (useMoodTrendQuery), `@repo/ui` (Card\*, Skeleton), `recharts`, `lucide-react`
**Provides**: `MoodTrendChart` component (used by analytics route)

---

### apps/app/components/analytics/mood-trend-chart.test.tsx [create]

**Purpose**: Tests for MoodTrendChart component
**TOTAL CHANGES**: 1 (create file)

**Reference Implementation**:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MoodTrendChart } from "./mood-trend-chart";

vi.mock("@/lib/queries/analytics", () => ({
  useMoodTrendQuery: vi.fn().mockReturnValue({
    data: {
      trend: [
        {
          date: "2026-03-08",
          averageScore: 3.5,
          entryCount: 2,
          moods: { Happy: 1, Calm: 1 },
        },
        {
          date: "2026-03-09",
          averageScore: 4.0,
          entryCount: 1,
          moods: { Happy: 1 },
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
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

describe("MoodTrendChart", () => {
  it("renders the chart title", () => {
    render(<MoodTrendChart />, { wrapper: createWrapper() });
    expect(screen.getByText("Mood Trend")).toBeInTheDocument();
  });

  it("renders area chart when data exists", () => {
    render(<MoodTrendChart />, { wrapper: createWrapper() });
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });

  it("shows empty state when no trend data", async () => {
    const { useMoodTrendQuery } = await import("@/lib/queries/analytics");
    vi.mocked(useMoodTrendQuery).mockReturnValue({
      data: { trend: [] },
      isLoading: false,
    } as ReturnType<typeof useMoodTrendQuery>);

    render(<MoodTrendChart />, { wrapper: createWrapper() });
    expect(screen.getByText("No trend data yet")).toBeInTheDocument();
  });

  it("shows loading skeleton", async () => {
    const { useMoodTrendQuery } = await import("@/lib/queries/analytics");
    vi.mocked(useMoodTrendQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useMoodTrendQuery>);

    render(<MoodTrendChart />, { wrapper: createWrapper() });
    expect(document.querySelector(".h-\\[300px\\]")).toBeInTheDocument();
  });
});
```

**Dependencies**: `apps/app/components/analytics/mood-trend-chart.tsx`
**Provides**: Test coverage for MoodTrendChart

---

### apps/app/components/analytics/tag-correlation.tsx [create]

**Purpose**: Tag correlation table/list showing tags sorted by average mood score
**TOTAL CHANGES**: 1 (create file)

**Changes**:

1. Create component rendering a styled table of tags with entry counts and mood scores

**Implementation Details**:

- Import `useTagCorrelationQuery` from `@/lib/queries/analytics`
- Import `Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Skeleton` from `@repo/ui`
- Import `Tags` from `lucide-react`
- No Recharts dependency (simple table per PRD: "Simple table/list view")
- Color-code mood scores: >= 4 green, >= 3 amber, < 3 red
- Empty state when no qualifying tags

**Reference Implementation**:

```tsx
import { useTagCorrelationQuery } from "@/lib/queries/analytics";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@repo/ui";
import { Tags } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 4) return "text-green-600 dark:text-green-400";
  if (score >= 3) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBadgeVariant(
  score: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 4) return "default";
  if (score >= 3) return "secondary";
  return "destructive";
}

export function TagCorrelation() {
  const { data, isLoading } = useTagCorrelationQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Insights</CardTitle>
        <CardDescription>
          How your activities correlate with your mood (tags with 3+ entries)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data?.correlations.length ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Tags className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No tag insights yet</p>
            <p className="text-sm">
              Add tags to your journal entries to discover mood patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.correlations.map((item) => (
              <div
                key={item.tag}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{item.tag}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.entryCount}{" "}
                    {item.entryCount === 1 ? "entry" : "entries"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${scoreColor(item.averageMoodScore)}`}
                  >
                    {item.averageMoodScore.toFixed(1)}
                  </span>
                  <Badge variant={scoreBadgeVariant(item.averageMoodScore)}>
                    {item.averageMoodScore >= 4
                      ? "Positive"
                      : item.averageMoodScore >= 3
                        ? "Neutral"
                        : "Low"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Dependencies**: `@/lib/queries/analytics` (useTagCorrelationQuery), `@repo/ui` (Badge, Card\*, Skeleton), `lucide-react`
**Provides**: `TagCorrelation` component (used by analytics route)

---

### apps/app/components/analytics/tag-correlation.test.tsx [create]

**Purpose**: Tests for TagCorrelation component
**TOTAL CHANGES**: 1 (create file)

**Reference Implementation**:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TagCorrelation } from "./tag-correlation";

vi.mock("@/lib/queries/analytics", () => ({
  useTagCorrelationQuery: vi.fn().mockReturnValue({
    data: {
      correlations: [
        { tag: "Nature", entryCount: 5, averageMoodScore: 4.2 },
        { tag: "Work", entryCount: 10, averageMoodScore: 2.8 },
        { tag: "Fitness", entryCount: 3, averageMoodScore: 3.5 },
      ],
    },
    isLoading: false,
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

describe("TagCorrelation", () => {
  it("renders the title", () => {
    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("Tag Insights")).toBeInTheDocument();
  });

  it("renders tag names", () => {
    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("Nature")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Fitness")).toBeInTheDocument();
  });

  it("renders entry counts", () => {
    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("5 entries")).toBeInTheDocument();
    expect(screen.getByText("10 entries")).toBeInTheDocument();
    expect(screen.getByText("3 entries")).toBeInTheDocument();
  });

  it("renders mood score badges", () => {
    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("Positive")).toBeInTheDocument(); // Nature 4.2
    expect(screen.getByText("Neutral")).toBeInTheDocument(); // Fitness 3.5
    expect(screen.getByText("Low")).toBeInTheDocument(); // Work 2.8
  });

  it("shows empty state when no correlations", async () => {
    const { useTagCorrelationQuery } = await import("@/lib/queries/analytics");
    vi.mocked(useTagCorrelationQuery).mockReturnValue({
      data: { correlations: [] },
      isLoading: false,
    } as ReturnType<typeof useTagCorrelationQuery>);

    render(<TagCorrelation />, { wrapper: createWrapper() });
    expect(screen.getByText("No tag insights yet")).toBeInTheDocument();
  });
});
```

**Dependencies**: `apps/app/components/analytics/tag-correlation.tsx`
**Provides**: Test coverage for TagCorrelation

---

### apps/app/routes/(app)/analytics.tsx [edit]

**Purpose**: Replace placeholder analytics page with real mood analytics dashboard
**TOTAL CHANGES**: 1 (complete rewrite of file content)

**Changes**:

1. Replace entire file content (lines 1-150) with tabbed analytics dashboard using the three chart components

**Implementation Details**:

- Use `createFileRoute("/(app)/analytics")` (same route path as current)
- Import `Tabs, TabsContent, TabsList, TabsTrigger` from `@repo/ui`
- Import `MoodBarChart` from `@/components/analytics/mood-bar-chart`
- Import `MoodTrendChart` from `@/components/analytics/mood-trend-chart`
- Import `TagCorrelation` from `@/components/analytics/tag-correlation`
- Default tab: "weekly" (mood bar chart)
- Three tabs: "Weekly" (bar chart), "Trend" (area chart), "Tags" (correlation table)

**Reference Implementation**:

```tsx
import { MoodBarChart } from "@/components/analytics/mood-bar-chart";
import { MoodTrendChart } from "@/components/analytics/mood-trend-chart";
import { TagCorrelation } from "@/components/analytics/tag-correlation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/analytics")({
  component: Analytics,
});

function Analytics() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Insights</h2>
        <p className="text-muted-foreground">
          Understand your mood patterns and discover what impacts your
          well-being.
        </p>
      </div>

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4">
          <MoodBarChart />
        </TabsContent>

        <TabsContent value="trend" className="mt-4">
          <MoodTrendChart />
        </TabsContent>

        <TabsContent value="tags" className="mt-4">
          <TagCorrelation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Dependencies**: `@/components/analytics/mood-bar-chart` (MoodBarChart), `@/components/analytics/mood-trend-chart` (MoodTrendChart), `@/components/analytics/tag-correlation` (TagCorrelation), `@repo/ui` (Tabs\*)
**Provides**: Analytics route page at `/analytics`

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                                                      | Action | Depends On                                                                                                                                                                            |
| ----- | --------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `ai_review/user_stories/analytics.yaml`                   | create | --                                                                                                                                                                                    |
| 1     | `apps/api/routers/analytics.ts`                           | create | --                                                                                                                                                                                    |
| 1     | `apps/app/package.json`                                   | edit   | --                                                                                                                                                                                    |
| 1     | `packages/ui/index.ts`                                    | edit   | --                                                                                                                                                                                    |
| 2     | `apps/api/routers/analytics.test.ts`                      | create | `apps/api/routers/analytics.ts`                                                                                                                                                       |
| 2     | `apps/api/lib/app.ts`                                     | edit   | `apps/api/routers/analytics.ts`                                                                                                                                                       |
| 2     | `apps/app/lib/queries/analytics.ts`                       | create | `apps/api/lib/app.ts`                                                                                                                                                                 |
| 3     | `apps/app/components/analytics/mood-bar-chart.tsx`        | create | `apps/app/lib/queries/analytics.ts`                                                                                                                                                   |
| 3     | `apps/app/components/analytics/mood-trend-chart.tsx`      | create | `apps/app/lib/queries/analytics.ts`                                                                                                                                                   |
| 3     | `apps/app/components/analytics/tag-correlation.tsx`       | create | `apps/app/lib/queries/analytics.ts`                                                                                                                                                   |
| 4     | `apps/app/components/analytics/mood-bar-chart.test.tsx`   | create | `apps/app/components/analytics/mood-bar-chart.tsx`                                                                                                                                    |
| 4     | `apps/app/components/analytics/mood-trend-chart.test.tsx` | create | `apps/app/components/analytics/mood-trend-chart.tsx`                                                                                                                                  |
| 4     | `apps/app/components/analytics/tag-correlation.test.tsx`  | create | `apps/app/components/analytics/tag-correlation.tsx`                                                                                                                                   |
| 4     | `apps/app/routes/(app)/analytics.tsx`                     | edit   | `apps/app/components/analytics/mood-bar-chart.tsx`, `apps/app/components/analytics/mood-trend-chart.tsx`, `apps/app/components/analytics/tag-correlation.tsx`, `packages/ui/index.ts` |

---

## Exit Criteria

### Test Commands

```bash
bun test --run              # Run all Vitest tests (API + App)
bun lint                    # ESLint with cache
bun typecheck               # tsc --build (all workspaces)
```

### Pre-Implementation Setup

```bash
# Install recharts (after editing package.json)
bun install

# Add shadcn/ui components
bun ui:add tabs tooltip

# Export new components (edit packages/ui/index.ts)
```

### Success Conditions

- [ ] All tests pass (`bun test --run` exit code 0)
- [ ] No linting errors (`bun lint` exit code 0)
- [ ] No type errors (`bun typecheck` exit code 0)
- [ ] Weekly mood bar chart renders with correct data, color-coded by mood
- [ ] Week navigation works (prev/next week arrows)
- [ ] 30-day mood trend line chart renders with daily averages
- [ ] Tag correlation table shows tags sorted by average mood score
- [ ] Empty states display appropriate messages
- [ ] All API tests pass (analytics.test.ts)
- [ ] All component tests pass (mood-bar-chart.test.tsx, mood-trend-chart.test.tsx, tag-correlation.test.tsx)
- [ ] Bowser QA YAML exists at `ai_review/user_stories/analytics.yaml`

### Verification Script

```bash
bun test --run && bun lint && bun typecheck
```
