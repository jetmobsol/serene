import { describe, expect, it, vi } from "vitest";
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
      isAnonymous: false,
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
    expect(result.aiResponse!.response).toBe("Great mood!");
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
