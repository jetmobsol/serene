import { TRPCError } from "@trpc/server";
import { MOODS, TAGS } from "@repo/core";
import { journalEntry } from "@repo/db/schema/journal.js";
import { and, eq, lt, or } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../lib/trpc.js";

const moodSchema = z.enum(MOODS);
const tagSchema = z.enum(TAGS);

export const journalRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        mood: moodSchema,
        tags: z.array(tagSchema).default([]),
        note: z.string().max(5000).default(""),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [entry] = await ctx.dbDirect
        .insert(journalEntry)
        .values({
          userId: ctx.user.id,
          mood: input.mood,
          tags: input.tags,
          note: input.note,
        })
        .returning();

      return entry;
    }),

  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      let cursorFilter: ReturnType<typeof and> | undefined = undefined;

      if (cursor) {
        let parsed: { createdAt: string; id: string };
        try {
          parsed = JSON.parse(atob(cursor));
        } catch {
          throw new TRPCError({ code: "BAD_REQUEST" });
        }
        if (!parsed.createdAt || !parsed.id) {
          throw new TRPCError({ code: "BAD_REQUEST" });
        }
        const cursorDate = new Date(parsed.createdAt);

        cursorFilter = or(
          lt(journalEntry.createdAt, cursorDate),
          and(
            eq(journalEntry.createdAt, cursorDate),
            lt(journalEntry.id, parsed.id),
          ),
        );
      }

      const rows = await ctx.db.query.journalEntry.findMany({
        where: (table, { eq: whereEq, and: whereAnd }) =>
          cursorFilter
            ? whereAnd(whereEq(table.userId, ctx.user.id), cursorFilter)
            : whereEq(table.userId, ctx.user.id),
        with: {
          aiResponse: true,
        },
        orderBy: (table, { desc: orderDesc }) => [
          orderDesc(table.createdAt),
          orderDesc(table.id),
        ],
        limit: limit + 1,
      });

      const hasMore = rows.length > limit;
      const entries = hasMore ? rows.slice(0, limit) : rows;

      let nextCursor: string | null = null;
      if (hasMore) {
        const lastEntry = entries[entries.length - 1];
        nextCursor = btoa(
          JSON.stringify({
            createdAt: lastEntry.createdAt.toISOString(),
            id: lastEntry.id,
          }),
        );
      }

      return { entries, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const entry = await ctx.db.query.journalEntry.findFirst({
        where: (table, { eq: whereEq, and: whereAnd }) =>
          whereAnd(
            whereEq(table.id, input.id),
            whereEq(table.userId, ctx.user.id),
          ),
        with: {
          aiResponse: true,
        },
      });

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return entry;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        mood: moodSchema.optional(),
        tags: z.array(tagSchema).optional(),
        note: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const existing = await ctx.db.query.journalEntry.findFirst({
        where: (table, { eq: whereEq, and: whereAnd }) =>
          whereAnd(whereEq(table.id, id), whereEq(table.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updated] = await ctx.dbDirect
        .update(journalEntry)
        .set(updates)
        .where(
          and(eq(journalEntry.id, id), eq(journalEntry.userId, ctx.user.id)),
        )
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.journalEntry.findFirst({
        where: (table, { eq: whereEq, and: whereAnd }) =>
          whereAnd(
            whereEq(table.id, input.id),
            whereEq(table.userId, ctx.user.id),
          ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.dbDirect
        .delete(journalEntry)
        .where(
          and(
            eq(journalEntry.id, input.id),
            eq(journalEntry.userId, ctx.user.id),
          ),
        );

      return { success: true as const };
    }),
});
