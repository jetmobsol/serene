import { journalEntry } from "@repo/db/schema/journal.js";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../lib/trpc.js";

export const analyticsRouter = router({
  weeklyMoodDistribution: protectedProcedure
    .input(
      z.object({
        weekStart: z.string().date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const weekStartDate = new Date(input.weekStart);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);

      const rows = await ctx.db
        .select({
          mood: journalEntry.mood,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(journalEntry)
        .where(
          and(
            eq(journalEntry.userId, ctx.user.id),
            gte(journalEntry.createdAt, weekStartDate),
            lt(journalEntry.createdAt, weekEndDate),
          ),
        )
        .groupBy(journalEntry.mood);

      const totalEntries = rows.reduce((sum, row) => sum + row.count, 0);

      return {
        distribution: rows,
        totalEntries,
      };
    }),
});
