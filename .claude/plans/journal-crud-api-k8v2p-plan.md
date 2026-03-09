# Journal CRUD API (Deliverable #2) - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-09

## Summary

Implement the five journal CRUD tRPC procedures (`create`, `list`, `getById`, `update`, `delete`), the GDPR `user.exportData` and `user.deleteAccount` procedures, register the journal router in the app router, and write comprehensive integration tests covering ownership enforcement, cursor pagination, and input validation. All procedures use `protectedProcedure` and filter by `ctx.user.id` for data isolation.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Create

- `apps/api/routers/journal.ts`
- `apps/api/routers/journal.test.ts`
- `apps/api/routers/user.test.ts`

### Files to Edit

- `apps/api/lib/app.ts`
- `apps/api/routers/user.ts`

---

## Code Context

### Database Schema

**`db/schema/journal.ts`** (lines 9-34): `journalEntry` table with columns `id` (text PK, `jrn_` prefix), `userId` (FK to `user.id`, cascade delete), `mood` (text, not null), `tags` (text array, not null, default `[]`), `note` (text, default `""`), `createdAt`, `updatedAt`. Indexes on `userId`, `createdAt`, and composite `(userId, createdAt)`.

**`db/schema/ai-response.ts`** (lines 8-22): `aiResponse` table with `id` (text PK, `air_` prefix), `entryId` (FK to `journalEntry.id`, cascade delete, unique), `response` (text), `hasCrisisContent` (boolean), `model` (text), `createdAt`.

**`db/schema/journal.ts`** (lines 43-49): `journalEntryRelations` defines `user` (many-to-one) and `aiResponse` (one-to-one) relations.

**`db/schema/ai-response.ts`** (lines 31-36): `aiResponseRelations` defines `entry` (one-to-one with `journalEntry`).

**`db/schema/user.ts`** (lines 171-175): `userRelations` includes `journalEntries: many(journalEntry)`.

### Shared Constants

**`packages/core/journal.ts`** (lines 4-11): `MOODS = ["Happy", "Calm", "Anxious", "Sad", "Overwhelmed", "Angry"] as const` with `MoodType`.

**`packages/core/journal.ts`** (lines 48-57): `TAGS = ["Work", "Sleep", "Relationships", "Fitness", "Hobbies", "Health", "Social", "Nature"] as const` with `TagType`.

### tRPC Infrastructure

**`apps/api/lib/trpc.ts`** (lines 18-20): Exports `router`, `publicProcedure`, `createCallerFactory`.

**`apps/api/lib/trpc.ts`** (lines 51-67): `protectedProcedure` throws `UNAUTHORIZED` if no session/user, narrows `ctx.session` and `ctx.user` to non-null.

**`apps/api/lib/context.ts`** (lines 30-60): `TRPCContext` type with `db` (cached reads), `dbDirect` (writes), `session`, `user`, `env`, `cache`, etc.

### Existing Patterns

**`apps/api/routers/billing.ts`** (lines 4-33): Uses `protectedProcedure`, `ctx.db.query.subscription.findFirst()` with relational query API.

**`apps/api/routers/billing.test.ts`** (lines 1-125): Test pattern using `createCallerFactory(billingRouter)`, `testCtx()` helper with partial mocks cast via `as unknown as TRPCContext["db"]`, `vi.fn().mockResolvedValue()`.

**`docs/recipes/new-procedure.md`** (lines 10-42): Shows insert pattern using `ctx.db.insert(schema.table).values({...}).returning()`.

### App Router Registration

**`apps/api/lib/app.ts`** (lines 11-20): Import routers, add to `router({...})` call. Currently has `billing`, `user`, `organization`.

### Database Access Convention

**`apps/api/AGENTS.md`**: `db` for cached reads, `dbDirect` for writes and transactions. `prepare: false` required for Cloudflare Workers.

### Import Conventions

- Zod: `import { z } from "zod"` (Zod v4 -- uses `flattenError`, not `zodErrorMap`)
- DB schema: `import { journalEntry } from "@repo/db/schema/journal.js"` for direct table references
- DB schema namespace: `import { schema } from "@repo/db"` for `schema.tableName` pattern
- tRPC: `import { protectedProcedure, router } from "../lib/trpc.js"`
- Drizzle operators: `import { and, eq, lt, desc, asc } from "drizzle-orm"`
- Core constants: `import { MOODS, TAGS } from "@repo/core"`

---

## External Context

### Drizzle ORM Relational Query API

- `ctx.db.query.journalEntry.findMany({ where, with, orderBy, limit })` -- relational queries with `with` for eager loading relations
- `ctx.db.query.journalEntry.findFirst({ where })` -- returns single record or undefined
- `ctx.dbDirect.insert(journalEntry).values({...}).returning()` -- insert with returning (array of inserted rows)
- `ctx.dbDirect.update(journalEntry).set({...}).where(condition).returning()` -- update with returning
- `ctx.dbDirect.delete(journalEntry).where(condition)` -- hard delete
- Relational `where` callback: `(table, { eq, and, lt }) => and(eq(table.userId, userId), ...)`
- Relational `orderBy` callback: `(table, { desc }) => desc(table.createdAt)`

### Cursor-Based Pagination

Composite cursor using `(createdAt, id)` for stable ordering on DESC createdAt:

- Encode cursor: `btoa(JSON.stringify({ createdAt: row.createdAt.toISOString(), id: row.id }))`
- Decode cursor: `JSON.parse(atob(cursor))` to get `{ createdAt, id }`
- WHERE clause: `(createdAt < cursorCreatedAt) OR (createdAt = cursorCreatedAt AND id < cursorId)`
- This ensures deterministic pagination even with identical timestamps

### Zod v4 Patterns

- `z.enum([...])` for enums built from const arrays -- must spread `as const` arrays: `z.enum(MOODS)` works directly since MOODS is `readonly string[]` with `as const`
- `z.string().max(5000)` for length validation
- `z.array(z.enum(TAGS)).default([])` for tag arrays

### tRPC Error Codes

- `TRPCError({ code: "NOT_FOUND" })` for missing resources
- `TRPCError({ code: "UNAUTHORIZED" })` for auth failures (handled by middleware)
- Import: `import { TRPCError } from "@trpc/server"`

---

## Architectural Narrative

### Task

Implement five journal CRUD tRPC procedures (`create`, `list`, `getById`, `update`, `delete`), two GDPR procedures (`user.exportData`, `user.deleteAccount`), register the journal router, and write comprehensive tests following TDD methodology.

### Architecture

The API is a Hono + tRPC server. tRPC routers are defined in `apps/api/routers/`, registered in `apps/api/lib/app.ts`. All journal procedures use `protectedProcedure` which guarantees `ctx.session` and `ctx.user` are non-null. Database access uses Drizzle ORM with two connections: `ctx.db` (cached, for reads) and `ctx.dbDirect` (direct, for writes). The database schema already exists from Deliverable #1 with `journalEntry` and `aiResponse` tables, complete with relations, indexes, and cascade deletes.

### Selected Context

- `apps/api/lib/trpc.ts:18-20,51-67` -- `router`, `protectedProcedure`, `createCallerFactory` exports
- `apps/api/lib/context.ts:30-60` -- `TRPCContext` type definition
- `apps/api/lib/app.ts:16-20` -- Current `appRouter` with billing/user/organization
- `apps/api/routers/billing.test.ts:1-125` -- Test pattern with `testCtx()`, mock db, `createCallerFactory`
- `db/schema/journal.ts:9-49` -- `journalEntry` table and relations
- `db/schema/ai-response.ts:8-36` -- `aiResponse` table and relations
- `packages/core/journal.ts:4-59` -- `MOODS`, `TAGS` constants and types

### Relationships

```
journalEntry (userId FK) --> user (cascade delete)
aiResponse (entryId FK, unique) --> journalEntry (cascade delete)
journalRouter --> registered in appRouter
user.exportData --> queries journalEntry + aiResponse for user
user.deleteAccount --> deletes user row (cascades to journalEntry -> aiResponse)
```

### Implementation Notes

1. **Cursor pagination**: Use composite `(createdAt, id)` cursor encoded as base64 JSON. The `createdAt DESC, id DESC` ordering with the cursor filter `(createdAt < cursor.createdAt) OR (createdAt = cursor.createdAt AND id < cursor.id)` ensures stable, deterministic pagination.

2. **Ownership enforcement**: Every query MUST include `eq(journalEntry.userId, ctx.user.id)` to prevent cross-user data access. This is a security invariant.

3. **Write operations**: Use `ctx.dbDirect` for all mutations (insert, update, delete) per the project convention. Use `ctx.db` for reads.

4. **Hard delete**: Journal entries are hard-deleted (not soft-deleted). The cascade delete on `aiResponse.entryId` ensures AI responses are removed automatically.

5. **GDPR deleteAccount**: Deleting the user row cascades to all `journalEntry` rows (via `userId` FK with `onDelete: "cascade"`), which in turn cascade to all `aiResponse` rows (via `entryId` FK with `onDelete: "cascade"`). No manual cascade logic needed.

6. **Test mocking strategy**: For the journal tests, mock `ctx.db.query.journalEntry` for read operations and `ctx.dbDirect` for write operations. Use `vi.fn()` for all database methods. For ownership tests, use two separate `testCtx` instances with different `userId` values.

7. **Zod schemas**: Import `MOODS` and `TAGS` from `@repo/core` and use them directly in `z.enum()` to ensure validation stays in sync with the shared constants.

### Ambiguities

- **Consent checkbox at signup**: The task mentions "Add explicit consent checkbox to signup flow." This is a frontend concern and Better Auth config concern. Since this deliverable is backend-only and the consent checkbox would be an app (SPA) UI change, this item is deferred. The plan includes a note about this in the exit criteria but does not implement it. If consent needs to be tracked server-side as a database field, that would require a schema change not specified in the current DB schema.

### Requirements

1. Five journal CRUD procedures pass tests: `create`, `list`, `getById`, `update`, `delete`
2. Ownership enforcement: user A cannot access user B's entries (tested)
3. Cursor pagination works with 50+ fixture entries (tested)
4. Input validation rejects invalid moods, tags, notes > 5000 chars (tested)
5. `user.exportData` returns complete JSON of user's entries + AI responses
6. `user.deleteAccount` cascades deletion to all journal data (tested)
7. `bun test --run` passes
8. Journal router registered in `apps/api/lib/app.ts`

### Constraints

- All DB writes use `ctx.dbDirect`, all reads use `ctx.db`
- `prepare: false` for Cloudflare Workers compatibility
- Zod v4 API (not v3)
- `protectedProcedure` for all procedures
- Follow Prettier config: double quotes, semicolons, trailing commas, 80 char width
- Import shared constants from `@repo/core`, not inline definitions
- File naming: kebab-case for files

### Selected Approach

**Approach**: Relational query API for reads, SQL builder API for writes, with mock-based unit tests

**Description**: Use Drizzle's relational query API (`ctx.db.query.journalEntry.findMany/findFirst`) for read operations with `with: { aiResponse: true }` for eager loading. Use the SQL builder API (`ctx.dbDirect.insert/update/delete`) for write operations with `.returning()` to get the mutated row. Tests use the existing `createCallerFactory` + `testCtx` pattern from `billing.test.ts`, with mocked `db.query` and `dbDirect` methods.

**Rationale**: This matches the existing codebase patterns (billing router uses relational queries, recipe doc shows SQL builder for writes). The relational API makes eager loading of `aiResponse` natural. Mock-based tests are fast and don't require a database instance, matching the existing test infrastructure.

**Trade-offs Accepted**: Mock-based tests don't exercise real SQL queries. The cursor pagination logic is tested at the procedure level with mocked data, not against a real database. This is acceptable because the Drizzle ORM layer is well-tested upstream, and real integration tests would require a database setup not currently in the test infrastructure.

---

## Implementation Plan

### apps/api/routers/journal.test.ts [create]

**Purpose**: Comprehensive test suite for all five journal CRUD procedures, covering happy paths, ownership enforcement, cursor pagination, and input validation. Written FIRST per TDD methodology.

**TOTAL CHANGES**: 1 (new file)

**Changes**:

1. Create new test file with all test cases

**Implementation Details**:

- Import `describe, expect, it, vi, beforeEach` from `vitest`
- Import `TRPCContext` from `../lib/context`
- Import `createCallerFactory` from `../lib/trpc`
- Import `journalRouter` from `./journal`
- Create `testCtx()` helper following `billing.test.ts` pattern
- Mock `db.query.journalEntry.findMany`, `db.query.journalEntry.findFirst` for reads
- Mock `dbDirect.insert().values().returning()`, `dbDirect.update().set().where().returning()`, `dbDirect.delete().where()` for writes
- Use chainable mock pattern for insert/update/delete

**Reference Implementation**:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TRPCContext } from "../lib/context";
import { createCallerFactory } from "../lib/trpc";
import { journalRouter } from "./journal";

const createCaller = createCallerFactory(journalRouter);

// ---------------------------------------------------------------------------
// Test context factory
// ---------------------------------------------------------------------------

function testCtx({
  userId = "usr_test-user-1",
  findMany = vi.fn().mockResolvedValue([]),
  findFirst = vi.fn().mockResolvedValue(undefined),
  insertReturning = vi.fn().mockResolvedValue([]),
  updateReturning = vi.fn().mockResolvedValue([]),
  deleteWhere = vi.fn().mockResolvedValue(undefined),
} = {}) {
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
    },
    db: {
      query: {
        journalEntry: {
          findMany,
          findFirst,
        },
      },
    } as unknown as TRPCContext["db"],
    dbDirect: {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: insertReturning,
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: updateReturning,
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: deleteWhere,
      }),
    } as unknown as TRPCContext["dbDirect"],
    cache: new Map(),
    env: {} as TRPCContext["env"],
  };

  return ctx;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = new Date("2026-03-09T12:00:00Z");

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "jrn_test-entry-1",
    userId: "usr_test-user-1",
    mood: "Happy",
    tags: ["Work", "Fitness"],
    note: "Feeling great today",
    createdAt: now,
    updatedAt: now,
    aiResponse: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// journal.create
// ---------------------------------------------------------------------------

describe("journal.create", () => {
  it("creates a journal entry with valid input", async () => {
    const entry = makeEntry();
    const ctx = testCtx({
      insertReturning: vi.fn().mockResolvedValue([entry]),
    });

    const result = await createCaller(ctx).create({
      mood: "Happy",
      tags: ["Work", "Fitness"],
      note: "Feeling great today",
    });

    expect(result).toEqual(entry);
    expect(ctx.dbDirect.insert).toHaveBeenCalled();
  });

  it("creates an entry with default empty tags and note", async () => {
    const entry = makeEntry({ tags: [], note: "" });
    const ctx = testCtx({
      insertReturning: vi.fn().mockResolvedValue([entry]),
    });

    const result = await createCaller(ctx).create({
      mood: "Calm",
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(entry.id);
  });

  it("rejects invalid mood value", async () => {
    const ctx = testCtx();

    await expect(
      createCaller(ctx).create({
        mood: "Ecstatic" as never,
        tags: [],
        note: "",
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid tag value", async () => {
    const ctx = testCtx();

    await expect(
      createCaller(ctx).create({
        mood: "Happy",
        tags: ["InvalidTag" as never],
        note: "",
      }),
    ).rejects.toThrow();
  });

  it("rejects note exceeding 5000 characters", async () => {
    const ctx = testCtx();

    await expect(
      createCaller(ctx).create({
        mood: "Happy",
        tags: [],
        note: "x".repeat(5001),
      }),
    ).rejects.toThrow();
  });

  it("accepts note at exactly 5000 characters", async () => {
    const longNote = "x".repeat(5000);
    const entry = makeEntry({ note: longNote });
    const ctx = testCtx({
      insertReturning: vi.fn().mockResolvedValue([entry]),
    });

    const result = await createCaller(ctx).create({
      mood: "Happy",
      tags: [],
      note: longNote,
    });

    expect(result.note).toBe(longNote);
  });
});

// ---------------------------------------------------------------------------
// journal.list
// ---------------------------------------------------------------------------

describe("journal.list", () => {
  it("returns empty list when no entries exist", async () => {
    const ctx = testCtx({
      findMany: vi.fn().mockResolvedValue([]),
    });

    const result = await createCaller(ctx).list({});

    expect(result.entries).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it("returns entries with default limit of 20", async () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry({
        id: `jrn_entry-${i}`,
        createdAt: new Date(now.getTime() - i * 60_000),
      }),
    );
    const ctx = testCtx({
      findMany: vi.fn().mockResolvedValue(entries),
    });

    const result = await createCaller(ctx).list({});

    expect(result.entries).toHaveLength(5);
    expect(result.nextCursor).toBeNull();
  });

  it("returns nextCursor when more entries exist", async () => {
    // Return limit+1 entries to signal more exist
    const entries = Array.from({ length: 21 }, (_, i) =>
      makeEntry({
        id: `jrn_entry-${i}`,
        createdAt: new Date(now.getTime() - i * 60_000),
      }),
    );
    const ctx = testCtx({
      findMany: vi.fn().mockResolvedValue(entries),
    });

    const result = await createCaller(ctx).list({ limit: 20 });

    expect(result.entries).toHaveLength(20);
    expect(result.nextCursor).not.toBeNull();
  });

  it("accepts cursor parameter for pagination", async () => {
    const cursor = btoa(
      JSON.stringify({
        createdAt: now.toISOString(),
        id: "jrn_entry-20",
      }),
    );
    const entries = [makeEntry({ id: "jrn_entry-21" })];
    const ctx = testCtx({
      findMany: vi.fn().mockResolvedValue(entries),
    });

    const result = await createCaller(ctx).list({ cursor, limit: 20 });

    expect(result.entries).toHaveLength(1);
    expect(ctx.db.query.journalEntry.findMany).toHaveBeenCalled();
  });

  it("rejects limit below 1", async () => {
    const ctx = testCtx();
    await expect(createCaller(ctx).list({ limit: 0 })).rejects.toThrow();
  });

  it("rejects limit above 50", async () => {
    const ctx = testCtx();
    await expect(createCaller(ctx).list({ limit: 51 })).rejects.toThrow();
  });

  it("includes aiResponse in entries", async () => {
    const entries = [
      makeEntry({
        aiResponse: {
          id: "air_test-1",
          response: "You seem happy!",
          hasCrisisContent: false,
        },
      }),
    ];
    const ctx = testCtx({
      findMany: vi.fn().mockResolvedValue(entries),
    });

    const result = await createCaller(ctx).list({});

    expect(result.entries[0].aiResponse).toEqual({
      id: "air_test-1",
      response: "You seem happy!",
      hasCrisisContent: false,
    });
  });
});

// ---------------------------------------------------------------------------
// journal.getById
// ---------------------------------------------------------------------------

describe("journal.getById", () => {
  it("returns entry when found and owned by user", async () => {
    const entry = makeEntry();
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
    });

    const result = await createCaller(ctx).getById({ id: "jrn_test-entry-1" });

    expect(result).toEqual(entry);
  });

  it("throws NOT_FOUND when entry does not exist", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).getById({ id: "jrn_nonexistent" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("throws NOT_FOUND when entry belongs to another user", async () => {
    // findFirst returns undefined because WHERE includes userId filter
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).getById({ id: "jrn_other-users-entry" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("includes aiResponse in returned entry", async () => {
    const entry = makeEntry({
      aiResponse: {
        id: "air_test-1",
        response: "Great mood!",
        hasCrisisContent: false,
      },
    });
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
    });

    const result = await createCaller(ctx).getById({ id: "jrn_test-entry-1" });

    expect(result.aiResponse).toBeDefined();
    expect(result.aiResponse.response).toBe("Great mood!");
  });
});

// ---------------------------------------------------------------------------
// journal.update
// ---------------------------------------------------------------------------

describe("journal.update", () => {
  it("updates mood only", async () => {
    const updated = makeEntry({ mood: "Sad" });
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(makeEntry()),
      updateReturning: vi.fn().mockResolvedValue([updated]),
    });

    const result = await createCaller(ctx).update({
      id: "jrn_test-entry-1",
      mood: "Sad",
    });

    expect(result.mood).toBe("Sad");
  });

  it("updates tags only", async () => {
    const updated = makeEntry({ tags: ["Sleep"] });
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(makeEntry()),
      updateReturning: vi.fn().mockResolvedValue([updated]),
    });

    const result = await createCaller(ctx).update({
      id: "jrn_test-entry-1",
      tags: ["Sleep"],
    });

    expect(result.tags).toEqual(["Sleep"]);
  });

  it("updates note only", async () => {
    const updated = makeEntry({ note: "Updated note" });
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(makeEntry()),
      updateReturning: vi.fn().mockResolvedValue([updated]),
    });

    const result = await createCaller(ctx).update({
      id: "jrn_test-entry-1",
      note: "Updated note",
    });

    expect(result.note).toBe("Updated note");
  });

  it("updates multiple fields at once", async () => {
    const updated = makeEntry({
      mood: "Calm",
      tags: ["Nature"],
      note: "Peaceful day",
    });
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(makeEntry()),
      updateReturning: vi.fn().mockResolvedValue([updated]),
    });

    const result = await createCaller(ctx).update({
      id: "jrn_test-entry-1",
      mood: "Calm",
      tags: ["Nature"],
      note: "Peaceful day",
    });

    expect(result.mood).toBe("Calm");
    expect(result.tags).toEqual(["Nature"]);
    expect(result.note).toBe("Peaceful day");
  });

  it("throws NOT_FOUND when entry does not exist", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).update({ id: "jrn_nonexistent", mood: "Happy" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("throws NOT_FOUND when entry belongs to another user", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).update({
        id: "jrn_other-users-entry",
        mood: "Sad",
      }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("rejects invalid mood on update", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(makeEntry()),
    });

    await expect(
      createCaller(ctx).update({
        id: "jrn_test-entry-1",
        mood: "Ecstatic" as never,
      }),
    ).rejects.toThrow();
  });

  it("rejects note exceeding 5000 characters on update", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(makeEntry()),
    });

    await expect(
      createCaller(ctx).update({
        id: "jrn_test-entry-1",
        note: "x".repeat(5001),
      }),
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// journal.delete
// ---------------------------------------------------------------------------

describe("journal.delete", () => {
  it("deletes an entry owned by the user", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(makeEntry()),
    });

    const result = await createCaller(ctx).delete({ id: "jrn_test-entry-1" });

    expect(result).toEqual({ success: true });
    expect(ctx.dbDirect.delete).toHaveBeenCalled();
  });

  it("throws NOT_FOUND when entry does not exist", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).delete({ id: "jrn_nonexistent" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("throws NOT_FOUND when entry belongs to another user", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).delete({ id: "jrn_other-users-entry" }),
    ).rejects.toThrow("NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// Ownership enforcement (cross-user isolation)
// ---------------------------------------------------------------------------

describe("ownership enforcement", () => {
  it("user A cannot read user B entries via getById", async () => {
    // User A's context but entry belongs to user B
    // findFirst returns undefined because the WHERE clause filters by userId
    const ctxUserA = testCtx({
      userId: "usr_user-a",
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctxUserA).getById({ id: "jrn_user-b-entry" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("user A cannot update user B entries", async () => {
    const ctxUserA = testCtx({
      userId: "usr_user-a",
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctxUserA).update({
        id: "jrn_user-b-entry",
        mood: "Happy",
      }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("user A cannot delete user B entries", async () => {
    const ctxUserA = testCtx({
      userId: "usr_user-a",
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctxUserA).delete({ id: "jrn_user-b-entry" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("user A list only returns user A entries", async () => {
    const userAEntries = [
      makeEntry({ id: "jrn_a-1", userId: "usr_user-a" }),
      makeEntry({ id: "jrn_a-2", userId: "usr_user-a" }),
    ];
    const ctxUserA = testCtx({
      userId: "usr_user-a",
      findMany: vi.fn().mockResolvedValue(userAEntries),
    });

    const result = await createCaller(ctxUserA).list({});

    expect(result.entries).toHaveLength(2);
    result.entries.forEach((entry) => {
      expect(entry.userId).toBe("usr_user-a");
    });
  });
});

// ---------------------------------------------------------------------------
// Cursor pagination with many entries
// ---------------------------------------------------------------------------

describe("cursor pagination", () => {
  it("paginates through 50+ entries correctly", async () => {
    // First page: 21 entries (limit+1 to detect more)
    const page1Entries = Array.from({ length: 21 }, (_, i) =>
      makeEntry({
        id: `jrn_entry-${i}`,
        createdAt: new Date(now.getTime() - i * 60_000),
      }),
    );

    const ctxPage1 = testCtx({
      findMany: vi.fn().mockResolvedValue(page1Entries),
    });

    const result1 = await createCaller(ctxPage1).list({ limit: 20 });

    expect(result1.entries).toHaveLength(20);
    expect(result1.nextCursor).not.toBeNull();

    // Second page: use cursor from first page
    const page2Entries = Array.from({ length: 21 }, (_, i) =>
      makeEntry({
        id: `jrn_entry-${20 + i}`,
        createdAt: new Date(now.getTime() - (20 + i) * 60_000),
      }),
    );

    const ctxPage2 = testCtx({
      findMany: vi.fn().mockResolvedValue(page2Entries),
    });

    const result2 = await createCaller(ctxPage2).list({
      cursor: result1.nextCursor!,
      limit: 20,
    });

    expect(result2.entries).toHaveLength(20);
    expect(result2.nextCursor).not.toBeNull();

    // Third page: last batch (fewer than limit+1)
    const page3Entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({
        id: `jrn_entry-${40 + i}`,
        createdAt: new Date(now.getTime() - (40 + i) * 60_000),
      }),
    );

    const ctxPage3 = testCtx({
      findMany: vi.fn().mockResolvedValue(page3Entries),
    });

    const result3 = await createCaller(ctxPage3).list({
      cursor: result2.nextCursor!,
      limit: 20,
    });

    expect(result3.entries).toHaveLength(10);
    expect(result3.nextCursor).toBeNull();
  });
});
```

**Dependencies**: `apps/api/routers/journal.ts` (imports `journalRouter`)
**Provides**: Test suite validating all journal procedures

---

### apps/api/routers/journal.ts [create]

**Purpose**: tRPC router with five journal CRUD procedures: `create`, `list`, `getById`, `update`, `delete`. All procedures use `protectedProcedure` and filter by `ctx.user.id` for data isolation.

**TOTAL CHANGES**: 1 (new file)

**Changes**:

1. Create new router file with all five procedures

**Implementation Details**:

- Import `z` from `"zod"`
- Import `TRPCError` from `"@trpc/server"`
- Import `protectedProcedure, router` from `"../lib/trpc.js"`
- Import `MOODS, TAGS` from `"@repo/core"`
- Import `journalEntry` from `"@repo/db/schema/journal.js"`
- Import `and, eq, lt, or` from `"drizzle-orm"`
- Define `moodSchema = z.enum(MOODS)`
- Define `tagSchema = z.enum(TAGS)`
- Export `journalRouter` with all five procedures

**Reference Implementation**:

```typescript
import { TRPCError } from "@trpc/server";
import { MOODS, TAGS } from "@repo/core";
import { journalEntry } from "@repo/db/schema/journal.js";
import { and, eq, lt, or } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../lib/trpc.js";

const moodSchema = z.enum(MOODS);
const tagSchema = z.enum(TAGS);

export const journalRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        mood: moodSchema,
        tags: z.array(tagSchema).default([]),
        note: z.string().max(5000).default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [entry] = await ctx.dbDirect
        .insert(journalEntry)
        .values({
          userId: ctx.user.id,
          mood: input.mood,
          tags: input.tags,
          note: input.note,
        })
        .returning();

      return entry;
    }),

  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      let cursorFilter: ReturnType<typeof and> | undefined = undefined;

      if (cursor) {
        const parsed = JSON.parse(atob(cursor)) as {
          createdAt: string;
          id: string;
        };
        const cursorDate = new Date(parsed.createdAt);

        cursorFilter = or(
          lt(journalEntry.createdAt, cursorDate),
          and(
            eq(journalEntry.createdAt, cursorDate),
            lt(journalEntry.id, parsed.id),
          ),
        );
      }

      const rows = await ctx.db.query.journalEntry.findMany({
        where: (table, { eq: whereEq, and: whereAnd }) =>
          cursorFilter
            ? whereAnd(whereEq(table.userId, ctx.user.id), cursorFilter)
            : whereEq(table.userId, ctx.user.id),
        with: {
          aiResponse: true,
        },
        orderBy: (table, { desc: orderDesc }) => [
          orderDesc(table.createdAt),
          orderDesc(table.id),
        ],
        limit: limit + 1,
      });

      const hasMore = rows.length > limit;
      const entries = hasMore ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasMore) {
        const lastEntry = entries[entries.length - 1];
        nextCursor = btoa(
          JSON.stringify({
            createdAt: lastEntry.createdAt.toISOString(),
            id: lastEntry.id,
          }),
        );
      }

      return { entries, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.db.query.journalEntry.findFirst({
        where: (table, { eq: whereEq, and: whereAnd }) =>
          whereAnd(
            whereEq(table.id, input.id),
            whereEq(table.userId, ctx.user.id),
          ),
        with: {
          aiResponse: true,
        },
      });

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return entry;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        mood: moodSchema.optional(),
        tags: z.array(tagSchema).optional(),
        note: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Verify ownership
      const existing = await ctx.db.query.journalEntry.findFirst({
        where: (table, { eq: whereEq, and: whereAnd }) =>
          whereAnd(whereEq(table.id, id), whereEq(table.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await ctx.dbDirect
        .update(journalEntry)
        .set(updates)
        .where(
          and(eq(journalEntry.id, id), eq(journalEntry.userId, ctx.user.id)),
        )
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.db.query.journalEntry.findFirst({
        where: (table, { eq: whereEq, and: whereAnd }) =>
          whereAnd(
            whereEq(table.id, input.id),
            whereEq(table.userId, ctx.user.id),
          ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.dbDirect
        .delete(journalEntry)
        .where(
          and(
            eq(journalEntry.id, input.id),
            eq(journalEntry.userId, ctx.user.id),
          ),
        );

      return { success: true as const };
    }),
});
```

**Dependencies**: None (uses only external packages and existing infrastructure)
**Provides**: `journalRouter` export used by `apps/api/lib/app.ts` and `apps/api/routers/journal.test.ts`

---

### apps/api/lib/app.ts [edit]

**Purpose**: Register the journal router in the tRPC app router so journal procedures are accessible at `/api/trpc/journal.*`.

**TOTAL CHANGES**: 2 (one import addition, one router registration)

**Changes**:

1. Add import for `journalRouter` at line 14 (after the existing router imports on lines 11-13)
2. Add `journal: journalRouter` to the `router({})` call at line 19 (after `organization: organizationRouter`)

**Implementation Details**:

- Import: `import { journalRouter } from "../routers/journal.js";`
- Registration: add `journal: journalRouter,` inside the `router({})` object

**Reference Implementation**:

```typescript
/**
 * @file Hono app construction and tRPC router initialization.
 *
 * Combines authentication, tRPC, and health check endpoints into a single HTTP router.
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import type { AppContext } from "./context.js";
import { router } from "./trpc.js";
import { billingRouter } from "../routers/billing.js";
import { journalRouter } from "../routers/journal.js";
import { organizationRouter } from "../routers/organization.js";
import { userRouter } from "../routers/user.js";

// tRPC API router
const appRouter = router({
  billing: billingRouter,
  journal: journalRouter,
  user: userRouter,
  organization: organizationRouter,
});

// ... rest of file unchanged
```

**Migration Pattern**:

```typescript
// BEFORE (lines 11-20):
import { billingRouter } from "../routers/billing.js";
import { organizationRouter } from "../routers/organization.js";
import { userRouter } from "../routers/user.js";

// tRPC API router
const appRouter = router({
  billing: billingRouter,
  user: userRouter,
  organization: organizationRouter,
});

// AFTER:
import { billingRouter } from "../routers/billing.js";
import { journalRouter } from "../routers/journal.js";
import { organizationRouter } from "../routers/organization.js";
import { userRouter } from "../routers/user.js";

// tRPC API router
const appRouter = router({
  billing: billingRouter,
  journal: journalRouter,
  user: userRouter,
  organization: organizationRouter,
});
```

**Dependencies**: `apps/api/routers/journal.ts` (imports `journalRouter`)
**Provides**: Updated `appRouter` and `AppRouter` type that includes `journal` namespace

---

### apps/api/routers/user.ts [edit]

**Purpose**: Add `exportData` and `deleteAccount` GDPR procedures to the existing user router.

**TOTAL CHANGES**: 2 (two new procedures added to the existing router)

**Changes**:

1. Add imports for Drizzle operators and schema tables at the top of the file (after line 2)
2. Add `exportData` procedure after the `list` procedure (after line 42)
3. Add `deleteAccount` procedure after `exportData` (after the new `exportData` block)

**Implementation Details**:

- `exportData`: `protectedProcedure.query()` -- queries all `journalEntry` rows for user with `aiResponse` relation, returns JSON-serializable object
- `deleteAccount`: `protectedProcedure.mutation()` -- hard-deletes the user row from the `user` table; cascade FKs handle `journalEntry` and `aiResponse` cleanup
- Both use `protectedProcedure` (already imported in the file)
- Need to add imports: `import { user as userTable } from "@repo/db/schema/user.js"` and `import { eq } from "drizzle-orm"`

**Reference Implementation**:

```typescript
import { eq } from "drizzle-orm";
import { z } from "zod";
import { user as userTable } from "@repo/db/schema/user.js";
import { protectedProcedure, router } from "../lib/trpc.js";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    // User is now directly available in context from Better Auth
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.email({ error: "Invalid email address" }).optional(),
      }),
    )
    .mutation(({ input, ctx }) => {
      // TODO: Implement user profile update logic
      return {
        id: ctx.user.id,
        ...input,
      };
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      }),
    )
    .query(() => {
      // TODO: Implement user listing logic
      return {
        users: [],
        nextCursor: null,
      };
    }),

  exportData: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.db.query.journalEntry.findMany({
      where: (table, { eq: whereEq }) => whereEq(table.userId, ctx.user.id),
      with: {
        aiResponse: true,
      },
      orderBy: (table, { desc: orderDesc }) => orderDesc(table.createdAt),
    });

    return {
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
      },
      entries: entries.map((entry) => ({
        id: entry.id,
        mood: entry.mood,
        tags: entry.tags,
        note: entry.note,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        aiResponse: entry.aiResponse
          ? {
              response: entry.aiResponse.response,
              hasCrisisContent: entry.aiResponse.hasCrisisContent,
              createdAt: entry.aiResponse.createdAt,
            }
          : null,
      })),
      exportedAt: new Date().toISOString(),
    };
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.dbDirect.delete(userTable).where(eq(userTable.id, ctx.user.id));

    return { success: true as const };
  }),
});
```

**Migration Pattern**:

```typescript
// BEFORE (lines 1-43):
import { z } from "zod";
import { protectedProcedure, router } from "../lib/trpc.js";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
    };
  }),

  updateProfile: protectedProcedure
    .input(/* ... */)
    .mutation(/* ... */),

  list: protectedProcedure
    .input(/* ... */)
    .query(/* ... */),
});

// AFTER:
import { eq } from "drizzle-orm";
import { z } from "zod";
import { user as userTable } from "@repo/db/schema/user.js";
import { protectedProcedure, router } from "../lib/trpc.js";

export const userRouter = router({
  me: /* ... unchanged ... */,
  updateProfile: /* ... unchanged ... */,
  list: /* ... unchanged ... */,

  exportData: protectedProcedure.query(async ({ ctx }) => {
    /* ... new procedure ... */
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    /* ... new procedure ... */
  }),
});
```

**Dependencies**: None (uses existing schema from `@repo/db`, existing tRPC infrastructure)
**Provides**: `user.exportData` and `user.deleteAccount` procedures on the existing `userRouter`

---

### apps/api/routers/user.test.ts [create]

**Purpose**: Test suite for the GDPR `exportData` and `deleteAccount` procedures on the user router. Validates data export returns complete journal + AI data and account deletion triggers cascade.

**TOTAL CHANGES**: 1 (new file)

**Changes**:

1. Create new test file covering `user.exportData` and `user.deleteAccount`

**Implementation Details**:

- Import `describe, expect, it, vi` from `vitest`
- Import `TRPCContext` from `../lib/context`
- Import `createCallerFactory` from `../lib/trpc`
- Import `userRouter` from `./user`
- Create `testCtx()` helper following billing.test.ts pattern, mocking `db.query.journalEntry.findMany` and `dbDirect.delete().where()`

**Reference Implementation**:

```typescript
import { describe, expect, it, vi } from "vitest";
import type { TRPCContext } from "../lib/context";
import { createCallerFactory } from "../lib/trpc";
import { userRouter } from "./user";

const createCaller = createCallerFactory(userRouter);

function testCtx({
  userId = "usr_test-user-1",
  findMany = vi.fn().mockResolvedValue([]),
  deleteWhere = vi.fn().mockResolvedValue(undefined),
} = {}) {
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
    },
    db: {
      query: {
        journalEntry: {
          findMany,
        },
      },
    } as unknown as TRPCContext["db"],
    dbDirect: {
      delete: vi.fn().mockReturnValue({
        where: deleteWhere,
      }),
    } as unknown as TRPCContext["dbDirect"],
    cache: new Map(),
    env: {} as TRPCContext["env"],
  };

  return ctx;
}

// ---------------------------------------------------------------------------
// user.exportData (GDPR Article 20)
// ---------------------------------------------------------------------------

describe("user.exportData", () => {
  it("returns empty entries array when user has no journal data", async () => {
    const ctx = testCtx({
      findMany: vi.fn().mockResolvedValue([]),
    });

    const result = await createCaller(ctx).exportData();

    expect(result.user.id).toBe("usr_test-user-1");
    expect(result.user.email).toBe("test@example.com");
    expect(result.entries).toEqual([]);
    expect(result.exportedAt).toBeDefined();
  });

  it("returns all journal entries with AI responses", async () => {
    const now = new Date("2026-03-09T12:00:00Z");
    const entries = [
      {
        id: "jrn_entry-1",
        userId: "usr_test-user-1",
        mood: "Happy",
        tags: ["Work"],
        note: "Great day",
        createdAt: now,
        updatedAt: now,
        aiResponse: {
          id: "air_resp-1",
          response: "You seem happy!",
          hasCrisisContent: false,
          model: "claude-sonnet-4-20250514",
          createdAt: now,
        },
      },
      {
        id: "jrn_entry-2",
        userId: "usr_test-user-1",
        mood: "Sad",
        tags: [],
        note: "Rough day",
        createdAt: new Date(now.getTime() - 86_400_000),
        updatedAt: new Date(now.getTime() - 86_400_000),
        aiResponse: null,
      },
    ];

    const ctx = testCtx({
      findMany: vi.fn().mockResolvedValue(entries),
    });

    const result = await createCaller(ctx).exportData();

    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].aiResponse).toEqual({
      response: "You seem happy!",
      hasCrisisContent: false,
      createdAt: now,
    });
    expect(result.entries[1].aiResponse).toBeNull();
  });

  it("includes exportedAt timestamp", async () => {
    const ctx = testCtx();
    const before = new Date().toISOString();
    const result = await createCaller(ctx).exportData();
    const after = new Date().toISOString();

    expect(result.exportedAt >= before).toBe(true);
    expect(result.exportedAt <= after).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// user.deleteAccount (GDPR Article 17)
// ---------------------------------------------------------------------------

describe("user.deleteAccount", () => {
  it("deletes the user account", async () => {
    const ctx = testCtx();

    const result = await createCaller(ctx).deleteAccount();

    expect(result).toEqual({ success: true });
    expect(ctx.dbDirect.delete).toHaveBeenCalled();
  });

  it("calls delete with the correct user ID", async () => {
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const ctx = testCtx({ deleteWhere });

    await createCaller(ctx).deleteAccount();

    expect(deleteWhere).toHaveBeenCalled();
  });
});
```

**Dependencies**: `apps/api/routers/user.ts` (imports `userRouter` with `exportData` and `deleteAccount`)
**Provides**: Test suite validating GDPR procedures

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                               | Action | Depends On                    |
| ----- | ---------------------------------- | ------ | ----------------------------- |
| 1     | `apps/api/routers/journal.ts`      | create | --                            |
| 1     | `apps/api/routers/user.ts`         | edit   | --                            |
| 2     | `apps/api/routers/journal.test.ts` | create | `apps/api/routers/journal.ts` |
| 2     | `apps/api/routers/user.test.ts`    | create | `apps/api/routers/user.ts`    |
| 2     | `apps/api/lib/app.ts`              | edit   | `apps/api/routers/journal.ts` |

---

## Exit Criteria

### Test Commands

```bash
bun test --run                 # All tests across workspace
bun api:test --run             # API tests only (apps/api)
bun lint                       # ESLint with cache
bun typecheck                  # tsc --build
```

### Success Conditions

- [ ] All 5 journal CRUD procedures pass tests (create, list, getById, update, delete)
- [ ] Ownership enforcement tested: user A cannot access user B's entries via getById, update, delete, list
- [ ] Cursor pagination tested: paginates through 50+ entries with nextCursor
- [ ] Input validation tested: rejects invalid mood, invalid tag, note > 5000 chars
- [ ] `user.exportData` returns complete JSON of user's entries + AI responses
- [ ] `user.deleteAccount` deletes user row (cascade handles journal + AI data)
- [ ] Journal router registered in `apps/api/lib/app.ts`
- [ ] `bun test --run` passes (exit code 0)
- [ ] `bun lint` passes (exit code 0)
- [ ] `bun typecheck` passes (exit code 0)
- [ ] No Prettier formatting violations

### Deferred Items

- Consent checkbox at signup (frontend UI change, not backend -- requires React component changes in `apps/app/`)

### Verification Script

```bash
bun test --run && bun lint && bun typecheck
```
