# Foundation (DB Schema + Shared Types) - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-09

## Summary

Establish the database schema foundation for the Serene wellness journal by creating `journalEntry` and `aiResponse` tables with Drizzle ORM, shared mood/tag type constants in `@repo/core`, removing the existing OpenAI integration, and adding the Anthropic API key placeholder. This deliverable is backend-only with unit tests and no UI changes.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `db/schema/index.ts`
- `db/schema/user.ts`
- `packages/core/index.ts`
- `apps/api/index.ts`
- `apps/api/dev.ts`
- `apps/api/lib/env.ts`
- `apps/api/package.json`
- `.env`
- `.env.example`

### Files to Create

- `db/schema/journal.ts`
- `db/schema/ai-response.ts`
- `packages/core/journal.ts`
- `packages/core/journal.test.ts`

### Files to Delete

- `apps/api/lib/ai.ts`

---

## Code Context

### Existing Schema Patterns (db/schema/)

All schema files follow a consistent pattern observed in `user.ts`, `organization.ts`, `invitation.ts`, `passkey.ts`, `subscription.ts`:

1. **Imports**: `drizzle-orm/pg-core` for column types, `drizzle-orm` for `relations`, local `./id` for ID generators, cross-file table references for foreign keys.
2. **Table definition**: `pgTable("table_name", { columns }, (table) => [indexes])`.
3. **ID column**: `text().primaryKey().$defaultFn(() => generateAuthId("model"))` for auth tables, or `generateId("prefix")` for non-auth tables.
4. **Timestamps**: All use `timestamp({ withTimezone: true, mode: "date" })` pattern. `createdAt` uses `.defaultNow().notNull()`, `updatedAt` uses `.defaultNow().$onUpdate(() => new Date()).notNull()`.
5. **Type exports**: `export type X = typeof x.$inferSelect;` and `export type NewX = typeof x.$inferInsert;` immediately after table definition.
6. **Relations**: Defined as separate exported const after type exports, using `relations()` from `drizzle-orm`.
7. **Index naming**: `"{table_name}_{column_name}_idx"` pattern (e.g., `"session_user_id_idx"`).
8. **Foreign keys**: `.references(() => table.id, { onDelete: "cascade" })` inline in column definition.
9. **Casing**: Drizzle config at `db/drizzle.config.ts` line 38 uses `casing: "snake_case"` which auto-maps camelCase TypeScript column names to snake_case SQL columns.
10. **Comments**: Single-line comment at top of file describing the table purpose.

Reference files:

- `db/schema/user.ts:32-49` (user table definition)
- `db/schema/user.ts:170-173` (userRelations)
- `db/schema/organization.ts:1-4` (imports with relations)
- `db/schema/organization.ts:79-92` (relations with cross-file references)
- `db/schema/invitation.ts:1-7` (imports with cross-file table references)
- `db/schema/subscription.ts:15-49` (table without relations)
- `db/schema/id.ts:43-50` (generateId function for non-auth tables)

### ID System (db/schema/id.ts)

- `generateId(prefix: string): string` at line 43 -- validates 3 lowercase letters, format `{prefix}_{16-char-cuid2}`.
- `generateAuthId(model: AuthModel): string` at line 32 -- for Better Auth models only.
- New tables use `generateId("jrn")` and `generateId("air")` respectively. No changes needed to `id.ts`.

### Schema Index (db/schema/index.ts)

Current exports (lines 1-6):

```typescript
export * from "./id";
export * from "./invitation";
export * from "./organization";
export * from "./passkey";
export * from "./subscription";
export * from "./user";
```

Alphabetically sorted. New exports for `./journal` and `./ai-response` must be inserted in alphabetical order.

### User Relations (db/schema/user.ts:170-173)

Current:

```typescript
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  identities: many(identity),
}));
```

Needs `journalEntries: many(journalEntry)` added.

### Core Package (packages/core/)

- `package.json` name: `@repo/core`, exports `{ ".": "./index.ts" }`.
- `index.ts` currently exports only `export default {};`.
- No `src/` directory -- files live at package root.
- `tsconfig.json` includes `**/*.ts`.

### OpenAI Integration to Remove

1. `apps/api/lib/ai.ts` -- entire file to delete. Exports `getOpenAI(ctx: OpenAIContext): OpenAIProvider`.
2. `apps/api/index.ts:8` -- `export { getOpenAI } from "./lib/ai.js";` must be removed.
3. `apps/api/lib/env.ts:17` -- `OPENAI_API_KEY: z.string(),` must be replaced with `ANTHROPIC_API_KEY: z.string().optional(),`.
4. `apps/api/dev.ts:62` -- `"OPENAI_API_KEY",` in secretKeys array must be replaced with `"ANTHROPIC_API_KEY",`.
5. `apps/api/package.json` dependencies -- `"@ai-sdk/openai": "^3.0.29"` and `"ai": "^6.0.91"` must be removed.
6. `.env` lines 35-38 -- OpenAI section must be replaced with Anthropic.
7. `.env.example` lines 35-38 -- OpenAI section must be replaced with Anthropic.

**No other files import from `ai.ts` or reference `getOpenAI`** -- confirmed via grep.

### Vitest Configuration

- Root `vitest.config.ts` defines projects: `["apps/api", "apps/app"]`.
- `apps/api/vitest.config.ts` uses `defineProject({})` with no special config.
- `packages/core` is NOT in the vitest projects list. Tests in `packages/core/` need to be run directly or the root config needs updating.
- Test command: `bun test --run` (root level, runs vitest).
- The `packages/core/package.json` has no `test` script currently.

### Environment Files

- `.env` (committed, line 19): `DATABASE_URL=postgres://postgres:postgres@localhost:5434/serene`
- `.env.example` (committed): Template with placeholder values.
- Both have OpenAI section at lines 35-38 that needs replacement.

---

## External Context

No external library documentation lookup needed for this deliverable. All required APIs are:

- **Drizzle ORM**: Already used extensively in the codebase. Schema patterns fully established.
- **Vitest**: Already configured. Standard `describe`/`it`/`expect` API.
- **@paralleldrive/cuid2**: Already a dependency of `@repo/db`. Used via `generateId()` wrapper.

---

## Architectural Narrative

### Task

Create the database foundation for the Serene wellness journal app: two new tables (`journalEntry`, `aiResponse`), shared TypeScript constants for moods and tags, remove the OpenAI integration, and add Anthropic API key support. Unit tests for the shared types.

### Architecture

The monorepo has a clear layered architecture:

- `db/schema/` contains all Drizzle ORM table definitions, exported through `db/schema/index.ts` and re-exported via `db/index.ts` (line 9: `export * from "./schema"`).
- `packages/core/` provides shared TypeScript types/constants consumed by both `apps/api` and `apps/app` via the `@repo/core` workspace alias.
- `apps/api/lib/env.ts` validates all required environment variables at runtime with Zod.
- `apps/api/index.ts` is the public API surface that re-exports utilities.

### Selected Context

- `db/schema/user.ts` -- provides the `user` table that `journalEntry.userId` will reference, and `userRelations` that needs the `journalEntries` relation added.
- `db/schema/id.ts` -- provides `generateId("jrn")` and `generateId("air")` for ID generation.
- `db/schema/index.ts` -- barrel export file that needs new schema module re-exports.
- `packages/core/index.ts` -- barrel export that needs journal constants re-export.
- `apps/api/lib/ai.ts` -- the OpenAI integration to delete.
- `apps/api/lib/env.ts` -- the Zod env schema to update (swap OPENAI for ANTHROPIC).
- `apps/api/index.ts` -- public API surface that re-exports `getOpenAI` (must remove).
- `apps/api/dev.ts` -- dev server that lists secret keys to forward (swap OPENAI for ANTHROPIC).

### Relationships

- `journalEntry` has a foreign key to `user.id` (many-to-one).
- `aiResponse` has a foreign key to `journalEntry.id` (one-to-one, unique constraint on `entryId`).
- `userRelations` gains a `many(journalEntry)` relation.
- `journalEntryRelations` defines `one(user)` and `one(aiResponse)`.
- `aiResponseRelations` defines `one(journalEntry)`.
- Cross-file circular reference: `journal.ts` references `aiResponse` from `ai-response.ts`, and `ai-response.ts` references `journalEntry` from `journal.ts`. Drizzle handles this via lazy evaluation in `relations()` callbacks -- the table references are resolved at query time, not import time. The `pgTable` definitions use `references(() => table.id)` which is also lazy. This is the same pattern used by `invitation.ts` which imports both `user` and `organization`.

### External Context

No external APIs or libraries needed beyond what is already in the codebase.

### Implementation Notes

1. **Circular imports between journal.ts and ai-response.ts**: The `journalEntry` table references `aiResponse` in its relations, and `aiResponse` table references `journalEntry` in both its column definition (foreign key) and relations. Drizzle's `relations()` function uses callback-based lazy evaluation, so circular module references are safe. The foreign key `references(() => journalEntry.id)` is also lazy. This works because JavaScript modules resolve circular imports through the module registry -- by the time the callback executes, both modules are fully loaded.

2. **The `tags` column uses `text().array()`**: This is a PostgreSQL text array (`text[]`). Drizzle maps this correctly. The default `[]` is set via `.default([])`.

3. **The `aiResponse.entryId` uses `.unique()`**: This enforces the one-to-one relationship at the database level (one AI response per journal entry).

4. **Vitest project configuration**: The root `vitest.config.ts` only includes `apps/api` and `apps/app` as test projects. To run tests in `packages/core`, we need to add it to the projects list. Alternatively, `packages/core` tests can be run standalone. We should add `packages/core` to the root vitest projects and add a `test` script to `packages/core/package.json`.

5. **Environment variable change**: `OPENAI_API_KEY` was required (`z.string()`). `ANTHROPIC_API_KEY` should be optional (`z.string().optional()`) because Deliverable #3 will implement the actual AI integration. This prevents dev server startup failures for developers who don't yet have an Anthropic key.

6. **Package removal**: After removing `@ai-sdk/openai` and `ai` from `apps/api/package.json`, run `bun install` to update the lockfile.

### Ambiguities

- **Resolved**: The PRD says `packages/core/src/journal.ts` but the package has no `src/` directory. Using `packages/core/journal.ts` per task description.
- **Resolved**: The task says to update `.env.example` but the codebase also has `.env` (committed with placeholder values). Both must be updated to replace OpenAI with Anthropic.

### Requirements

1. `journalEntry` table created with all columns, indexes, types, and relations per PRD schema.
2. `aiResponse` table created with all columns, indexes, types, and relations per PRD schema.
3. `db/schema/index.ts` re-exports both new schema modules.
4. `userRelations` in `db/schema/user.ts` includes `journalEntries: many(journalEntry)`.
5. Shared mood/tag constants exported from `@repo/core` (`MOODS`, `MoodType`, `MOOD_SCORES`, `MOOD_COLORS`, `MOOD_ICONS`, `TAGS`, `TagType`, `TAG_ICONS`).
6. Unit tests for shared types pass.
7. `apps/api/lib/ai.ts` deleted, `getOpenAI` export removed from `apps/api/index.ts`.
8. `@ai-sdk/openai` and `ai` packages removed from `apps/api/package.json`.
9. `OPENAI_API_KEY` replaced with `ANTHROPIC_API_KEY` (optional) in env schema.
10. `.env` and `.env.example` updated: OpenAI section replaced with Anthropic section.
11. `apps/api/dev.ts` secret keys updated: `OPENAI_API_KEY` replaced with `ANTHROPIC_API_KEY`.
12. `bun db:push` succeeds.
13. `bun typecheck` passes.
14. `bun test --run` passes.

### Constraints

- Drizzle `casing: "snake_case"` is configured globally -- do NOT manually specify SQL column names. camelCase property names auto-map to snake_case.
- Prettier: double quotes, semicolons, trailing commas, 80 char width.
- File naming: kebab-case.
- ESM only (`"type": "module"`).
- No `any` types. No unnecessary type assertions.

### Selected Approach

**Approach**: Direct Drizzle schema creation with cross-file relations and barrel re-exports.

**Description**: Create two new schema files (`journal.ts`, `ai-response.ts`) following the exact patterns established by existing schema files like `organization.ts` and `invitation.ts`. Add a `journalEntries` relation to the existing `userRelations`. Create shared constants in `packages/core/journal.ts` and re-export through the barrel index. Remove OpenAI integration completely (delete file, remove export, remove deps, swap env var). Add vitest project for `packages/core` and write unit tests.

**Rationale**: This follows the established codebase patterns exactly. No new abstractions, no structural changes. The schema definitions are prescribed by the PRD and match the existing Drizzle conventions. The OpenAI removal is straightforward since `getOpenAI` is only exported from `apps/api/index.ts` and not consumed by any other file.

**Trade-offs Accepted**: The `ANTHROPIC_API_KEY` is optional in the Zod schema, which means the env validation won't catch a missing key until Deliverable #3 when the actual AI integration is built. This is intentional to avoid blocking development.

---

## Implementation Plan

### db/schema/journal.ts [create]

**Purpose**: Define the `journalEntry` table, its TypeScript types, and its Drizzle relations to `user` and `aiResponse`.

**TOTAL CHANGES**: 1 (create entire file)

**Changes**:

1. Create new file with complete `journalEntry` table definition, type exports, and relations.

**Implementation Details**:

- Import `relations` from `drizzle-orm`.
- Import `index`, `pgTable`, `text`, `timestamp` from `drizzle-orm/pg-core`.
- Import `generateId` from `./id`.
- Import `user` from `./user`.
- Import `aiResponse` from `./ai-response` (circular import -- safe due to lazy evaluation in relations callback and foreign key reference callback).
- Define `journalEntry` pgTable with columns: `id`, `userId`, `mood`, `tags`, `note`, `createdAt`, `updatedAt`.
- Define 3 indexes: `journal_entry_user_id_idx`, `journal_entry_created_at_idx`, `journal_entry_user_created_idx`.
- Export types `JournalEntry` and `NewJournalEntry`.
- Define and export `journalEntryRelations` with `one(user)` and `one(aiResponse)`.

**Reference Implementation**:

```typescript
// Journal entry storage for the Serene wellness journal

import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { aiResponse } from "./ai-response";
import { generateId } from "./id";
import { user } from "./user";

export const journalEntry = pgTable(
  "journal_entry",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateId("jrn")),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mood: text().notNull(),
    tags: text().array().notNull().default([]),
    note: text().default(""),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("journal_entry_user_id_idx").on(table.userId),
    index("journal_entry_created_at_idx").on(table.createdAt),
    index("journal_entry_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export type JournalEntry = typeof journalEntry.$inferSelect;
export type NewJournalEntry = typeof journalEntry.$inferInsert;

// -----------------------------------------------------------------------
// Relations for better query experience
// -----------------------------------------------------------------------

export const journalEntryRelations = relations(journalEntry, ({ one }) => ({
  user: one(user, {
    fields: [journalEntry.userId],
    references: [user.id],
  }),
  aiResponse: one(aiResponse),
}));
```

**Dependencies**: `db/schema/ai-response.ts` (imports `aiResponse` table for relations)
**Provides**: `journalEntry` table, `JournalEntry` type, `NewJournalEntry` type, `journalEntryRelations`

---

### db/schema/ai-response.ts [create]

**Purpose**: Define the `aiResponse` table, its TypeScript types, and its Drizzle relation to `journalEntry`.

**TOTAL CHANGES**: 1 (create entire file)

**Changes**:

1. Create new file with complete `aiResponse` table definition, type exports, and relations.

**Implementation Details**:

- Import `relations` from `drizzle-orm`.
- Import `boolean`, `index`, `pgTable`, `text`, `timestamp` from `drizzle-orm/pg-core`.
- Import `generateId` from `./id`.
- Import `journalEntry` from `./journal`.
- Define `aiResponse` pgTable with columns: `id`, `entryId`, `response`, `hasCrisisContent`, `model`, `createdAt`.
- `entryId` has `.unique()` constraint enforcing one-to-one with `journalEntry`.
- Define 1 index: `ai_response_entry_id_idx`.
- Export types `AiResponse` and `NewAiResponse`.
- Define and export `aiResponseRelations` with `one(journalEntry)`.

**Reference Implementation**:

```typescript
// AI-generated vibe check responses for journal entries

import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { generateId } from "./id";
import { journalEntry } from "./journal";

export const aiResponse = pgTable(
  "ai_response",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => generateId("air")),
    entryId: text()
      .notNull()
      .unique()
      .references(() => journalEntry.id, { onDelete: "cascade" }),
    response: text().notNull(),
    hasCrisisContent: boolean().default(false).notNull(),
    model: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("ai_response_entry_id_idx").on(table.entryId)],
);

export type AiResponse = typeof aiResponse.$inferSelect;
export type NewAiResponse = typeof aiResponse.$inferInsert;

// -----------------------------------------------------------------------
// Relations for better query experience
// -----------------------------------------------------------------------

export const aiResponseRelations = relations(aiResponse, ({ one }) => ({
  entry: one(journalEntry, {
    fields: [aiResponse.entryId],
    references: [journalEntry.id],
  }),
}));
```

**Dependencies**: `db/schema/journal.ts` (imports `journalEntry` table for foreign key and relations)
**Provides**: `aiResponse` table, `AiResponse` type, `NewAiResponse` type, `aiResponseRelations`

---

### db/schema/index.ts [edit]

**Purpose**: Barrel export file for all database schema modules. Must re-export the two new schema files.

**TOTAL CHANGES**: 1

**Changes**:

1. Add `export * from "./ai-response";` and `export * from "./journal";` in alphabetical order among the existing exports (lines 1-6).

**Implementation Details**:

- `./ai-response` goes between `./id` and `./invitation` alphabetically.
- `./journal` goes between `./invitation` and `./organization` alphabetically.

**Reference Implementation**:

```typescript
export * from "./ai-response";
export * from "./id";
export * from "./invitation";
export * from "./journal";
export * from "./organization";
export * from "./passkey";
export * from "./subscription";
export * from "./user";
```

**Migration Pattern**:

```typescript
// BEFORE (lines 1-6):
export * from "./id";
export * from "./invitation";
export * from "./organization";
export * from "./passkey";
export * from "./subscription";
export * from "./user";

// AFTER:
export * from "./ai-response";
export * from "./id";
export * from "./invitation";
export * from "./journal";
export * from "./organization";
export * from "./passkey";
export * from "./subscription";
export * from "./user";
```

**Dependencies**: `db/schema/journal.ts`, `db/schema/ai-response.ts`
**Provides**: Re-exports all journal and AI response schema symbols

---

### db/schema/user.ts [edit]

**Purpose**: Add `journalEntries` relation to `userRelations` so Drizzle relational queries can traverse from user to their journal entries.

**TOTAL CHANGES**: 2

**Changes**:

1. Add import for `journalEntry` from `./journal` (after line 26, with other imports).
2. Add `journalEntries: many(journalEntry)` to `userRelations` at line 172.

**Implementation Details**:

- Import `journalEntry` from `"./journal"` alongside the existing `generateAuthId` import from `"./id"`.
- Add `journalEntries: many(journalEntry),` as the last property in the `userRelations` callback object.

**Reference Implementation**:

```typescript
// At top of file, add import (after line 26: import { generateAuthId } from "./id";)
import { journalEntry } from "./journal";

// Updated userRelations (replacing lines 170-173):
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  identities: many(identity),
  journalEntries: many(journalEntry),
}));
```

**Migration Pattern**:

```typescript
// BEFORE (line 26):
import { generateAuthId } from "./id";

// AFTER (lines 26-27):
import { generateAuthId } from "./id";
import { journalEntry } from "./journal";

// BEFORE (lines 170-173):
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  identities: many(identity),
}));

// AFTER:
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  identities: many(identity),
  journalEntries: many(journalEntry),
}));
```

**Dependencies**: `db/schema/journal.ts` (imports `journalEntry`)
**Provides**: Updated `userRelations` with `journalEntries` relation

---

### packages/core/journal.ts [create]

**Purpose**: Shared mood and tag constants, types, scores, colors, and icons for the Serene journal. Consumed by both API and frontend.

**TOTAL CHANGES**: 1 (create entire file)

**Changes**:

1. Create new file with all mood/tag constants and types.

**Implementation Details**:

- All constants are `as const` for literal type narrowing.
- `MoodType` and `TagType` are derived types from the const arrays.
- `MOOD_SCORES` maps each mood to a numeric wellness score (1-5).
- `MOOD_COLORS` maps each mood to light/dark oklch color values.
- `MOOD_ICONS` maps each mood to a Lucide icon component name (string).
- `TAG_ICONS` maps each tag to a Lucide icon component name (string).
- All `Record` types use the derived union types as keys for exhaustive checking.

**Reference Implementation**:

```typescript
// Shared mood and tag constants for the Serene wellness journal.
// Consumed by both API (validation) and frontend (rendering).

export const MOODS = [
  "Happy",
  "Calm",
  "Anxious",
  "Sad",
  "Overwhelmed",
  "Angry",
] as const;

export type MoodType = (typeof MOODS)[number];

export const MOOD_SCORES: Record<MoodType, number> = {
  Happy: 5,
  Calm: 4,
  Anxious: 2,
  Sad: 2,
  Overwhelmed: 1,
  Angry: 1,
};

export const MOOD_COLORS: Record<MoodType, { light: string; dark: string }> = {
  Happy: { light: "oklch(0.85 0.15 145)", dark: "oklch(0.45 0.15 145)" },
  Calm: { light: "oklch(0.85 0.10 220)", dark: "oklch(0.45 0.10 220)" },
  Anxious: {
    light: "oklch(0.85 0.15 75)",
    dark: "oklch(0.45 0.15 75)",
  },
  Sad: { light: "oklch(0.85 0.10 260)", dark: "oklch(0.45 0.10 260)" },
  Overwhelmed: {
    light: "oklch(0.85 0.15 30)",
    dark: "oklch(0.45 0.15 30)",
  },
  Angry: { light: "oklch(0.85 0.18 25)", dark: "oklch(0.45 0.18 25)" },
};

export const MOOD_ICONS: Record<MoodType, string> = {
  Happy: "Smile",
  Calm: "CloudSun",
  Anxious: "Zap",
  Sad: "CloudRain",
  Overwhelmed: "Waves",
  Angry: "Flame",
};

export const TAGS = [
  "Work",
  "Sleep",
  "Relationships",
  "Fitness",
  "Hobbies",
  "Health",
  "Social",
  "Nature",
] as const;

export type TagType = (typeof TAGS)[number];

export const TAG_ICONS: Record<TagType, string> = {
  Work: "Briefcase",
  Sleep: "Moon",
  Relationships: "Heart",
  Fitness: "Dumbbell",
  Hobbies: "Palette",
  Health: "Stethoscope",
  Social: "Users",
  Nature: "TreePine",
};
```

**Dependencies**: None
**Provides**: `MOODS`, `MoodType`, `MOOD_SCORES`, `MOOD_COLORS`, `MOOD_ICONS`, `TAGS`, `TagType`, `TAG_ICONS`

---

### packages/core/index.ts [edit]

**Purpose**: Re-export journal constants from the core package entrypoint so consumers can `import { MOODS } from "@repo/core"`.

**TOTAL CHANGES**: 1

**Changes**:

1. Replace the entire file content. Remove the placeholder `export default {};` and add `export * from "./journal";`.

**Implementation Details**:

- The file header comment should be updated to reflect the package now exports journal constants.
- Remove the default export since it serves no purpose.

**Reference Implementation**:

```typescript
/**
 * @file Core package entrypoint.
 *
 * Shared constants and types for the Serene wellness journal.
 */

export * from "./journal";
```

**Migration Pattern**:

```typescript
// BEFORE (lines 1-7):
/**
 * @file Core package entrypoint.
 *
 * Placeholder for shared utilities and WebSocket functionality.
 */

export default {};

// AFTER:
/**
 * @file Core package entrypoint.
 *
 * Shared constants and types for the Serene wellness journal.
 */

export * from "./journal";
```

**Dependencies**: `packages/core/journal.ts`
**Provides**: Re-exports all journal symbols from `@repo/core`

---

### packages/core/journal.test.ts [create]

**Purpose**: Unit tests for shared mood/tag constants to verify type safety, exhaustiveness, and value correctness.

**TOTAL CHANGES**: 1 (create entire file)

**Changes**:

1. Create test file with comprehensive tests for all exported constants.

**Implementation Details**:

- Use Vitest `describe`/`it`/`expect` API.
- Test that `MOODS` has exactly 6 entries.
- Test that `TAGS` has exactly 8 entries.
- Test that `MOOD_SCORES` has a numeric entry for every mood.
- Test that `MOOD_COLORS` has light and dark values for every mood.
- Test that `MOOD_ICONS` has a string entry for every mood.
- Test that `TAG_ICONS` has a string entry for every tag.
- Test specific score values for boundary conditions.
- Test that color values use oklch format.

**Reference Implementation**:

```typescript
import { describe, expect, it } from "vitest";
import {
  MOODS,
  MOOD_COLORS,
  MOOD_ICONS,
  MOOD_SCORES,
  TAGS,
  TAG_ICONS,
} from "./journal";
import type { MoodType, TagType } from "./journal";

describe("MOODS", () => {
  it("contains exactly 6 moods", () => {
    expect(MOODS).toHaveLength(6);
  });

  it("contains the expected mood values", () => {
    expect(MOODS).toEqual([
      "Happy",
      "Calm",
      "Anxious",
      "Sad",
      "Overwhelmed",
      "Angry",
    ]);
  });
});

describe("MOOD_SCORES", () => {
  it("has a numeric score for every mood", () => {
    for (const mood of MOODS) {
      expect(MOOD_SCORES[mood]).toBeTypeOf("number");
    }
  });

  it("scores range from 1 to 5", () => {
    for (const mood of MOODS) {
      expect(MOOD_SCORES[mood]).toBeGreaterThanOrEqual(1);
      expect(MOOD_SCORES[mood]).toBeLessThanOrEqual(5);
    }
  });

  it("assigns highest score to Happy and lowest to Overwhelmed/Angry", () => {
    expect(MOOD_SCORES.Happy).toBe(5);
    expect(MOOD_SCORES.Calm).toBe(4);
    expect(MOOD_SCORES.Overwhelmed).toBe(1);
    expect(MOOD_SCORES.Angry).toBe(1);
  });
});

describe("MOOD_COLORS", () => {
  it("has light and dark colors for every mood", () => {
    for (const mood of MOODS) {
      expect(MOOD_COLORS[mood]).toHaveProperty("light");
      expect(MOOD_COLORS[mood]).toHaveProperty("dark");
    }
  });

  it("uses oklch color format", () => {
    for (const mood of MOODS) {
      expect(MOOD_COLORS[mood].light).toMatch(/^oklch\(/);
      expect(MOOD_COLORS[mood].dark).toMatch(/^oklch\(/);
    }
  });
});

describe("MOOD_ICONS", () => {
  it("has a string icon name for every mood", () => {
    for (const mood of MOODS) {
      expect(MOOD_ICONS[mood]).toBeTypeOf("string");
      expect(MOOD_ICONS[mood].length).toBeGreaterThan(0);
    }
  });
});

describe("TAGS", () => {
  it("contains exactly 8 tags", () => {
    expect(TAGS).toHaveLength(8);
  });

  it("contains the expected tag values", () => {
    expect(TAGS).toEqual([
      "Work",
      "Sleep",
      "Relationships",
      "Fitness",
      "Hobbies",
      "Health",
      "Social",
      "Nature",
    ]);
  });
});

describe("TAG_ICONS", () => {
  it("has a string icon name for every tag", () => {
    for (const tag of TAGS) {
      expect(TAG_ICONS[tag]).toBeTypeOf("string");
      expect(TAG_ICONS[tag].length).toBeGreaterThan(0);
    }
  });
});
```

**Dependencies**: `packages/core/journal.ts`
**Provides**: Test coverage for all journal constants

---

### apps/api/lib/ai.ts [delete]

**Purpose**: Remove the OpenAI integration file entirely.

**TOTAL CHANGES**: 1

**Changes**:

1. Delete the file `apps/api/lib/ai.ts`.

**Implementation Details**:

- `rm apps/api/lib/ai.ts`
- No other file imports from this file except `apps/api/index.ts` (which is handled separately).

**Dependencies**: None
**Provides**: Nothing (removal)

---

### apps/api/index.ts [edit]

**Purpose**: Remove the `getOpenAI` re-export since `apps/api/lib/ai.ts` is being deleted.

**TOTAL CHANGES**: 1

**Changes**:

1. Remove line 8: `export { getOpenAI } from "./lib/ai.js";`

**Implementation Details**:

- Delete the single line. No replacement needed.

**Reference Implementation**:

```typescript
/**
 * @file Public API surface for the backend package.
 *
 * Re-exports the Hono app, tRPC router, and core utilities.
 */

// Core utilities and services
export { createAuth } from "./lib/auth.js";
export { createDb } from "./lib/db.js";

// Application and router exports
export { default as app, appRouter } from "./lib/app.js";

// Type exports
export type { AppRouter } from "./lib/app.js";
export type { AppContext } from "./lib/context.js";
// Re-export context type to fix TypeScript portability issues
export type * from "./lib/context.js";

// Default export is the core app
export { default } from "./lib/app.js";
```

**Migration Pattern**:

```typescript
// BEFORE (lines 7-9):
// Core utilities and services
export { getOpenAI } from "./lib/ai.js";
export { createAuth } from "./lib/auth.js";

// AFTER (lines 7-8):
// Core utilities and services
export { createAuth } from "./lib/auth.js";
```

**Dependencies**: None (this is a removal)
**Provides**: Updated public API surface without `getOpenAI`

---

### apps/api/lib/env.ts [edit]

**Purpose**: Replace `OPENAI_API_KEY` with `ANTHROPIC_API_KEY` (optional) in the Zod environment schema.

**TOTAL CHANGES**: 1

**Changes**:

1. Replace line 17 `OPENAI_API_KEY: z.string(),` with `ANTHROPIC_API_KEY: z.string().optional(),`

**Implementation Details**:

- The key changes from required (`z.string()`) to optional (`z.string().optional()`) because the AI integration is not yet implemented (Deliverable #3).
- The `Env` type at line 50 is auto-inferred from the schema, so it will automatically include `ANTHROPIC_API_KEY?: string`.

**Reference Implementation**:

```typescript
export const envSchema = z.object({
  ENVIRONMENT: z.enum(["production", "staging", "preview", "development"]),
  APP_NAME: z.string().default("Example"),
  APP_ORIGIN: z.url(),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  ANTHROPIC_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string(),
  RESEND_EMAIL_FROM: z.email(),
  // Stripe billing (optional -- app works without these, billing features disabled)
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_STARTER_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PRO_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().startsWith("price_").optional(),
});
```

**Migration Pattern**:

```typescript
// BEFORE (line 17):
  OPENAI_API_KEY: z.string(),

// AFTER:
  ANTHROPIC_API_KEY: z.string().optional(),
```

**Dependencies**: None
**Provides**: Updated `Env` type with `ANTHROPIC_API_KEY?: string` instead of `OPENAI_API_KEY: string`

---

### apps/api/dev.ts [edit]

**Purpose**: Replace `OPENAI_API_KEY` with `ANTHROPIC_API_KEY` in the dev server's secret keys forwarding list.

**TOTAL CHANGES**: 1

**Changes**:

1. Replace `"OPENAI_API_KEY",` with `"ANTHROPIC_API_KEY",` at line 62.

**Implementation Details**:

- The `secretKeys` array at line 58-70 lists environment variable names that are forwarded from `process.env` to the Cloudflare Workers platform proxy during local development.

**Migration Pattern**:

```typescript
// BEFORE (line 62):
    "OPENAI_API_KEY",

// AFTER:
    "ANTHROPIC_API_KEY",
```

**Dependencies**: None
**Provides**: Dev server forwards `ANTHROPIC_API_KEY` instead of `OPENAI_API_KEY`

---

### apps/api/package.json [edit]

**Purpose**: Remove `@ai-sdk/openai` and `ai` package dependencies.

**TOTAL CHANGES**: 1

**Changes**:

1. Remove lines with `"@ai-sdk/openai": "^3.0.29",` and `"ai": "^6.0.91",` from the `dependencies` object (lines 21 and 28).

**Implementation Details**:

- After editing this file, run `bun install` to update the lockfile and remove the packages from `node_modules`.

**Reference Implementation**:

```json
  "dependencies": {
    "@better-auth/passkey": "^1.4.18",
    "@better-auth/stripe": "^1.4.18",
    "@repo/core": "workspace:*",
    "@repo/db": "workspace:*",
    "@repo/email": "workspace:*",
    "@trpc/server": "^11.10.0",
    "better-auth": "^1.4.18",
    "dataloader": "^2.2.3",
    "drizzle-orm": "^0.45.1",
    "postgres": "^3.4.8",
    "resend": "^6.9.2",
    "stripe": "^20.3.1"
  },
```

**Migration Pattern**:

```json
// BEFORE (dependencies object):
    "@ai-sdk/openai": "^3.0.29",
    ...
    "ai": "^6.0.91",

// AFTER: both lines removed
```

**Dependencies**: None
**Provides**: Clean dependency list without OpenAI packages

---

### .env [edit]

**Purpose**: Replace OpenAI environment variables with Anthropic in the committed defaults file.

**TOTAL CHANGES**: 1

**Changes**:

1. Replace lines 35-38 (OpenAI section) with Anthropic section.

**Implementation Details**:

- Remove `OPENAI_ORGANIZATION=xxxxx` (no equivalent for Anthropic needed).
- Replace `OPENAI_API_KEY=xxxxx` with `ANTHROPIC_API_KEY=xxxxx`.
- Update the comment and URL.

**Migration Pattern**:

```bash
# BEFORE (lines 35-38):
# OpenAI
# https://platform.openai.com/
OPENAI_ORGANIZATION=xxxxx
OPENAI_API_KEY=xxxxx

# AFTER:
# Anthropic (AI vibe check responses)
# https://console.anthropic.com/
ANTHROPIC_API_KEY=xxxxx
```

**Dependencies**: None
**Provides**: Updated environment defaults with Anthropic key placeholder

---

### .env.example [edit]

**Purpose**: Replace OpenAI environment variables with Anthropic in the example environment file.

**TOTAL CHANGES**: 1

**Changes**:

1. Replace lines 35-38 (OpenAI section) with Anthropic section.

**Implementation Details**:

- Same change as `.env` -- remove `OPENAI_ORGANIZATION` line, replace `OPENAI_API_KEY` with `ANTHROPIC_API_KEY`, update comment and URL.

**Migration Pattern**:

```bash
# BEFORE (lines 35-38):
# OpenAI
# https://platform.openai.com/
OPENAI_ORGANIZATION=xxxxx
OPENAI_API_KEY=xxxxx

# AFTER:
# Anthropic (AI vibe check responses)
# https://console.anthropic.com/
ANTHROPIC_API_KEY=xxxxx
```

**Dependencies**: None
**Provides**: Updated example environment file with Anthropic key placeholder

---

### vitest.config.ts (root) [edit]

**Purpose**: Add `packages/core` to vitest test projects so `packages/core/journal.test.ts` is discovered and run by `bun test --run`.

**TOTAL CHANGES**: 1

**Changes**:

1. Add `"packages/core"` to the `test.projects` array at line 11.

**Implementation Details**:

- The projects array currently is `["apps/api", "apps/app"]`. Add `"packages/core"` to make it `["apps/api", "apps/app", "packages/core"]`.
- `packages/core` needs a vitest config file for this to work (see next file).

**Migration Pattern**:

```typescript
// BEFORE (line 11):
    projects: ["apps/api", "apps/app"],

// AFTER:
    projects: ["apps/api", "apps/app", "packages/core"],
```

**Dependencies**: None
**Provides**: Vitest discovers tests in `packages/core`

---

### packages/core/vitest.config.ts [create]

**Purpose**: Vitest project configuration for `packages/core`, enabling test discovery.

**TOTAL CHANGES**: 1 (create entire file)

**Changes**:

1. Create minimal vitest project config matching the pattern in `apps/api/vitest.config.ts`.

**Reference Implementation**:

```typescript
import { defineProject } from "vitest/config";

export default defineProject({});
```

**Dependencies**: None
**Provides**: Vitest project configuration for `packages/core`

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                             | Action | Depends On                                         |
| ----- | -------------------------------- | ------ | -------------------------------------------------- |
| 1     | `packages/core/journal.ts`       | create | --                                                 |
| 1     | `packages/core/vitest.config.ts` | create | --                                                 |
| 1     | `apps/api/lib/ai.ts`             | delete | --                                                 |
| 1     | `apps/api/lib/env.ts`            | edit   | --                                                 |
| 1     | `apps/api/dev.ts`                | edit   | --                                                 |
| 1     | `apps/api/package.json`          | edit   | --                                                 |
| 1     | `.env`                           | edit   | --                                                 |
| 1     | `.env.example`                   | edit   | --                                                 |
| 2     | `packages/core/index.ts`         | edit   | `packages/core/journal.ts`                         |
| 2     | `packages/core/journal.test.ts`  | create | `packages/core/journal.ts`                         |
| 2     | `apps/api/index.ts`              | edit   | `apps/api/lib/ai.ts` (deletion)                    |
| 2     | `vitest.config.ts`               | edit   | `packages/core/vitest.config.ts`                   |
| 2     | `db/schema/journal.ts`           | create | --                                                 |
| 2     | `db/schema/ai-response.ts`       | create | --                                                 |
| 3     | `db/schema/index.ts`             | edit   | `db/schema/journal.ts`, `db/schema/ai-response.ts` |
| 3     | `db/schema/user.ts`              | edit   | `db/schema/journal.ts`                             |

**Note on Phase 2 schema files**: `db/schema/journal.ts` and `db/schema/ai-response.ts` have a mutual circular import (journal imports aiResponse for relations, ai-response imports journalEntry for foreign key + relations). They must be created in the same phase. They are placed in Phase 2 (not Phase 1) because they have no dependency on Phase 1 files from this plan, but are grouped at Phase 2 for clarity -- they could equally be Phase 1. The dependency between them is circular and handled by JavaScript module loading, not by execution order.

---

## Exit Criteria

### Test Commands

```bash
bun test --run              # Vitest -- runs all test projects
bun typecheck               # tsc --build across all packages
bun lint                    # ESLint with cache
```

### Success Conditions

- [ ] All tests pass (exit code 0) -- specifically `packages/core/journal.test.ts`
- [ ] No linting errors (exit code 0)
- [ ] No type errors (exit code 0)
- [ ] `bun db:push` succeeds (schema syncs to database)
- [ ] `bun install` succeeds after package.json edits (lockfile updated)
- [ ] No references to `getOpenAI`, `@ai-sdk/openai`, `OPENAI_API_KEY` remain in source code
- [ ] `journalEntry` and `aiResponse` tables accept inserts via Drizzle
- [ ] All requirements from ### Requirements satisfied

### Post-Implementation Step

After all code changes are complete and tests pass, run `/simplify` to review all changed code for reuse, quality, and efficiency. Fix any issues found. Then re-run `bun test --run` to confirm nothing broke.

### Verification Script

```bash
bun install && bun test --run && bun typecheck && bun lint
```
