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
