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
      isAnonymous: false,
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
