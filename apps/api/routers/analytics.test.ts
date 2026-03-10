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
  // Helper to create a thenable object that resolves to selectResult
  const createThenable = () => ({
    having: vi.fn().mockResolvedValue(selectResult),
    orderBy: vi.fn().mockResolvedValue(selectResult),
    then: vi.fn((onFulfilled) =>
      Promise.resolve(selectResult).then(onFulfilled),
    ),
  });

  const selectChain = {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        groupBy: vi.fn().mockReturnValue(createThenable()),
        orderBy: vi.fn().mockResolvedValue(selectResult),
      }),
      groupBy: vi.fn().mockReturnValue(createThenable()),
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
          { tag: "Fitness", entry_count: 3, average_mood_score: 3.5 },
          { tag: "Work", entry_count: 10, average_mood_score: 2.8 },
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
