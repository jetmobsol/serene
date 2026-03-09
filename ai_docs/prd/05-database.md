# 6. Database Schema Design

> **Context:** New tables, relations, and migration strategy. Reference when working on `db/schema/` files.

---

## 6.1 New Tables

### `journal_entry` Table

```typescript
// db/schema/journal.ts

import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
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
    // Stored as JSON array string: '["Work","Sleep"]'
    tags: text().notNull().default("[]"),
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
```

### `ai_response` Table

```typescript
// db/schema/ai-response.ts

import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
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
  (table) => [
    index("ai_response_entry_id_idx").on(table.entryId),
  ],
);

export type AiResponse = typeof aiResponse.$inferSelect;
export type NewAiResponse = typeof aiResponse.$inferInsert;
```

## 6.2 ID Prefix Registration

Add to `db/schema/id.ts` `AUTH_PREFIX` map or use `generateId()` directly:

- `jrn` — journal entry
- `air` — AI response

These use `generateId(prefix)` (non-auth ID generator) since they are not Better Auth models.

## 6.3 Relations

```typescript
// In db/schema/journal.ts
export const journalEntryRelations = relations(journalEntry, ({ one }) => ({
  user: one(user, {
    fields: [journalEntry.userId],
    references: [user.id],
  }),
  aiResponse: one(aiResponse),
}));

export const aiResponseRelations = relations(aiResponse, ({ one }) => ({
  entry: one(journalEntry, {
    fields: [aiResponse.entryId],
    references: [journalEntry.id],
  }),
}));
```

## 6.4 Schema Export

Update `db/schema/index.ts`:
```typescript
export * from "./journal";
export * from "./ai-response";
```

## 6.5 Migration Strategy

- Use `bun db:push` for development (schema sync without migration files).
- Generate migration with `bun db:generate` before staging/production deployment.
- Seed script should create sample journal entries for development.
