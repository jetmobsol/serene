# 10. Testing Strategy

> **Context:** TDD methodology, test framework, coverage targets, fixtures, and test commands. Reference when writing any tests.

---

## 10.1 TDD Methodology

ALL feature implementation MUST follow Test-Driven Development:

1. **Red:** Write a failing test that describes the expected behavior.
2. **Green:** Write the minimum code to make the test pass.
3. **Refactor:** Improve the code while keeping tests green.

Tests are written BEFORE implementation code. Pull requests that add features without corresponding tests will be rejected.

## 10.2 Test Framework and Configuration

- **Runner:** Vitest 4.x (workspace-level config)
- **DOM Environment:** Happy DOM (for component tests)
- **Assertion Library:** Vitest built-in `expect` + `@testing-library/react`
- **Mocking:** Vitest `vi.mock()`, `vi.fn()`, `vi.spyOn()`

## 10.3 Test Categories and Coverage Targets

### Unit Tests (Target: >= 90% coverage)

| Module | File | Tests Cover |
|--------|------|-------------|
| Safety module | `apps/api/lib/safety.test.ts` | Crisis keyword detection, gibberish detection, edge cases |
| Prompt builder | `apps/api/lib/prompts.test.ts` | System prompt construction, variable interpolation |
| Shared types | `packages/core/src/journal.test.ts` | Mood scores, tag values, type guards |
| Date grouping | `apps/app/lib/utils/date-groups.test.ts` | Timeline date grouping logic |

### Integration Tests (Target: >= 80% coverage)

| Module | File | Tests Cover |
|--------|------|-------------|
| Journal router | `apps/api/routers/journal.test.ts` | CRUD operations, ownership validation, pagination, input validation |
| AI router | `apps/api/routers/ai.test.ts` | Vibe check generation, crisis detection, rate limiting, error handling |
| Analytics router | `apps/api/routers/analytics.test.ts` | Aggregation queries, empty states, date range handling |

**Integration Test Approach for tRPC Routers:**
```typescript
import { createCallerFactory } from "../lib/trpc";
import { journalRouter } from "./journal";

const createCaller = createCallerFactory(journalRouter);

describe("journal.create", () => {
  it("should create a journal entry for authenticated user", async () => {
    const caller = createCaller({
      db: testDb,
      dbDirect: testDb,
      user: mockUser,
      session: mockSession,
      cache: new Map(),
      env: mockEnv,
    });

    const result = await caller.create({
      mood: "Happy",
      tags: ["Work", "Fitness"],
      note: "Had a great day at the office and hit the gym after.",
    });

    expect(result.mood).toBe("Happy");
    expect(result.tags).toEqual(["Work", "Fitness"]);
    expect(result.id).toMatch(/^jrn_/);
  });
});
```

### Component Tests (Target: >= 80% coverage)

| Component | File | Tests Cover |
|-----------|------|-------------|
| MoodSelector | `mood-selector.test.tsx` | Selection, deselection, keyboard nav, ARIA attributes |
| TagChips | `tag-chips.test.tsx` | Multi-select toggle, visual states, accessibility |
| NoteEditor | `note-editor.test.tsx` | Character counting, threshold indicator, max length enforcement |
| EntryForm | `entry-form.test.tsx` | Form submission, validation, loading states, error states |
| Timeline | `timeline.test.tsx` | Date grouping, infinite scroll trigger, empty state |
| EntryCard | `entry-card.test.tsx` | Mood color coding, note truncation, action buttons |
| AiResponse | `ai-response.test.tsx` | Streaming display, completion state, crisis banner |
| MoodBarChart | `mood-bar-chart.test.tsx` | Data rendering, empty state, color coding |
| MoodTrendChart | `mood-trend-chart.test.tsx` | Trend line rendering, tooltip, date range |
| SafetyBanner | `safety-banner.test.tsx` | Content presence, non-dismissibility |

**Component Test Approach:**
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { MoodSelector } from "./mood-selector";

describe("MoodSelector", () => {
  it("should call onChange with selected mood", () => {
    const onChange = vi.fn();
    render(<MoodSelector value={null} onChange={onChange} />);

    fireEvent.click(screen.getByRole("radio", { name: /happy/i }));

    expect(onChange).toHaveBeenCalledWith("Happy");
  });

  it("should show active state for selected mood", () => {
    render(<MoodSelector value="Calm" onChange={vi.fn()} />);

    const calmCard = screen.getByRole("radio", { name: /calm/i });
    expect(calmCard).toHaveAttribute("aria-checked", "true");
  });
});
```

## 10.4 Database Test Fixtures

**File:** `db/test-fixtures/journal.ts`

```typescript
export const testUser = {
  id: "usr_test1234567890",
  name: "Test User",
  email: "test@serene.app",
  emailVerified: true,
  isAnonymous: false,
};

export const testEntries = [
  {
    id: "jrn_test0000000001",
    userId: testUser.id,
    mood: "Happy",
    tags: '["Work","Fitness"]',
    note: "Had a wonderful day. Everything went smoothly at work and I had a great workout after.",
    createdAt: new Date("2026-03-09T10:00:00Z"),
  },
  {
    id: "jrn_test0000000002",
    userId: testUser.id,
    mood: "Anxious",
    tags: '["Work","Relationships"]',
    note: "Feeling worried about the upcoming presentation. Also had a difficult conversation with a friend.",
    createdAt: new Date("2026-03-08T15:30:00Z"),
  },
  // ... more fixtures for various moods, tags, and dates
];
```

## 10.5 Test Commands

```bash
bun test                  # Run all tests in watch mode
bun test --run            # Run all tests once (CI)
bun api:test              # Run API tests only
bun app:test              # Run app tests only
bun test --coverage       # Run with coverage report
```
