import { describe, expect, it, vi } from "vitest";
import type { TRPCContext } from "../lib/context";
import { createCallerFactory } from "../lib/trpc";
import { analyticsRouter } from "./analytics";

const createCaller = createCallerFactory(analyticsRouter);

function testCtx({
  userId = "usr_test-user-1",
  selectResult = [] as unknown[],
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
      select: vi.fn().mockReturnValue(selectChain),
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
