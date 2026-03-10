import { MOODS, MOOD_SCORES, type MoodType } from "@repo/core";
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

  moodTrend: protectedProcedure
    .input(
      z.object({
        days: z.number().min(7).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      startDate.setHours(0, 0, 0, 0);

      const rows = await ctx.db
        .select({
          mood: journalEntry.mood,
          date: sql<string>`to_char(${journalEntry.createdAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(journalEntry)
        .where(
          and(
            eq(journalEntry.userId, ctx.user.id),
            gte(journalEntry.createdAt, startDate),
          ),
        )
        .groupBy(sql`${journalEntry.createdAt}::date`, journalEntry.mood)
        .orderBy(sql`${journalEntry.createdAt}::date`);

      // Group by date in application code
      const byDate = new Map<
        string,
        {
          totalScore: number;
          totalCount: number;
          moods: Record<string, number>;
        }
      >();

      for (const row of rows) {
        const existing = byDate.get(row.date) ?? {
          totalScore: 0,
          totalCount: 0,
          moods: {},
        };
        const score = MOOD_SCORES[row.mood as MoodType] ?? 0;
        existing.totalScore += score * row.count;
        existing.totalCount += row.count;
        existing.moods[row.mood] = row.count;
        byDate.set(row.date, existing);
      }

      const trend = Array.from(byDate.entries()).map(([date, data]) => ({
        date,
        averageScore:
          Math.round((data.totalScore / data.totalCount) * 100) / 100,
        entryCount: data.totalCount,
        moods: data.moods,
      }));

      return { trend };
    }),

  tagCorrelation: protectedProcedure.query(async ({ ctx }) => {
    const moodCaseFragments = MOODS.map(
      (mood) => `WHEN mood = '${mood}' THEN ${MOOD_SCORES[mood as MoodType]}`,
    ).join(" ");

    const result = await ctx.db.execute<{
      tag: string;
      entry_count: number;
      average_mood_score: number;
    }>(sql`
      SELECT
        unnest(tags) as tag,
        cast(count(*) as integer) as entry_count,
        cast(avg(CASE ${sql.raw(moodCaseFragments)} ELSE 0 END) as float) as average_mood_score
      FROM ${journalEntry}
      WHERE ${journalEntry.userId} = ${ctx.user.id}
      GROUP BY unnest(tags)
      HAVING count(*) >= 3
      ORDER BY average_mood_score DESC
    `);

    // Extract rows from result - Drizzle execute returns an array of rows
    const resultArray = Array.isArray(result)
      ? result
      : result && typeof result === "object" && "rows" in result
        ? (result as { rows: unknown[] }).rows
        : [];

    const rows = resultArray as Array<{
      tag: string;
      entry_count: number;
      average_mood_score: number;
    }>;

    return {
      correlations: rows.map(
        (row: {
          tag: string;
          entry_count: number;
          average_mood_score: number;
        }) => ({
          tag: row.tag,
          entryCount: row.entry_count,
          averageMoodScore: Math.round(row.average_mood_score * 100) / 100,
        }),
      ),
    };
  }),
});
