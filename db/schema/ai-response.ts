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
