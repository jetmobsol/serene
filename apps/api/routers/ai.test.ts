import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TRPCContext } from "../lib/context";
import { createCallerFactory } from "../lib/trpc";
import { aiRouter } from "./ai";

// Mock the Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: "It sounds like you had a wonderful day!",
            },
          ],
        }),
        stream: vi.fn(),
      },
    })),
  };
});

const createCaller = createCallerFactory(aiRouter);

// ---------------------------------------------------------------------------
// Test context factory
// ---------------------------------------------------------------------------

function testCtx({
  userId = "usr_test-user-1",
  findFirst = vi.fn().mockResolvedValue(undefined),
  insertReturning = vi.fn().mockResolvedValue([]),
  anthropicApiKey = "sk-ant-test-key-123",
  kvGet = vi.fn().mockResolvedValue(null),
  kvPut = vi.fn().mockResolvedValue(undefined),
} = {}) {
  const kv = {
    get: kvGet,
    put: kvPut,
  } as unknown as KVNamespace;

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
          findFirst,
        },
      },
    } as unknown as TRPCContext["db"],
    dbDirect: {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: insertReturning,
          }),
          returning: insertReturning,
        }),
      }),
    } as unknown as TRPCContext["dbDirect"],
    cache: new Map(),
    env: {
      ANTHROPIC_API_KEY: anthropicApiKey,
      AI_RATE_LIMIT: kv,
    } as TRPCContext["env"],
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
    note: "Had a really great day at work today",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ai.generateVibeCheck
// ---------------------------------------------------------------------------

describe("ai.generateVibeCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a vibe check for a valid entry", async () => {
    const entry = makeEntry();
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response: "It sounds like you had a wonderful day!",
      hasCrisisContent: false,
      model: "claude-sonnet-4-20250514",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    const result = await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(result.response).toBe("It sounds like you had a wonderful day!");
    expect(result.hasCrisisContent).toBe(false);
  });

  it("throws NOT_FOUND when entry does not exist", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).generateVibeCheck({ entryId: "jrn_nonexistent" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("throws NOT_FOUND when entry belongs to another user", async () => {
    const ctx = testCtx({
      userId: "usr_user-a",
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).generateVibeCheck({ entryId: "jrn_user-b-entry" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("returns generic response for gibberish input", async () => {
    const entry = makeEntry({ note: "asdfghjkl qwerty zxcvbn" });
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response:
        "Thanks for checking in today. Even showing up to journal is a positive step.",
      hasCrisisContent: false,
      model: "none",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    const result = await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(result.response).toContain("checking in today");
    expect(result.hasCrisisContent).toBe(false);
  });

  it("detects crisis keywords and prepends disclaimer", async () => {
    const entry = makeEntry({ note: "I want to kill myself" });
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response:
        "If you're in crisis or having thoughts of suicide, please reach out for support:\n\n988 Suicide & Crisis Lifeline: Call or text 988 (US)\nCrisis Text Line: Text HOME to 741741\n\nI hear you're going through an incredibly difficult time.",
      hasCrisisContent: true,
      model: "claude-sonnet-4-20250514",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    const result = await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(result.hasCrisisContent).toBe(true);
    expect(result.response).toContain("988 Suicide & Crisis Lifeline");
  });

  it("throws TOO_MANY_REQUESTS when rate limited", async () => {
    const entry = makeEntry();
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      kvGet: vi.fn().mockResolvedValue("20"),
    });

    await expect(
      createCaller(ctx).generateVibeCheck({ entryId: "jrn_test-entry-1" }),
    ).rejects.toThrow("Rate limit exceeded");
  });

  it("handles Anthropic API errors with fallback response", async () => {
    // Override the mock to throw an error
    const mod = await import("@anthropic-ai/sdk");
    const AnthropicMock = mod.default as unknown as ReturnType<typeof vi.fn>;
    AnthropicMock.mockImplementationOnce(
      () =>
        ({
          messages: {
            create: vi.fn().mockRejectedValue(new Error("API Error")),
          },
        }) as never,
    );

    const entry = makeEntry();
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response:
        "I wasn't able to generate a reflection right now. Remember, the act of journaling itself is a powerful step toward self-awareness.",
      hasCrisisContent: false,
      model: "claude-sonnet-4-20250514",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    const result = await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(result.response).toContain("wasn't able to generate a reflection");
    expect(result.hasCrisisContent).toBe(false);
  });

  it("persists AI response via upsert", async () => {
    const entry = makeEntry();
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response: "It sounds like you had a wonderful day!",
      hasCrisisContent: false,
      model: "claude-sonnet-4-20250514",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(ctx.dbDirect.insert).toHaveBeenCalled();
  });
});
