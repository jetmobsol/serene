import { eq } from "drizzle-orm";
import { z } from "zod";
import { user as userTable } from "@repo/db/schema/user.js";
import { protectedProcedure, router } from "../lib/trpc.js";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    // User is now directly available in context from Better Auth
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.email({ error: "Invalid email address" }).optional(),
      }),
    )
    .mutation(({ input, ctx }) => {
      // TODO: Implement user profile update logic
      return {
        id: ctx.user.id,
        ...input,
      };
    }),

  exportData: protectedProcedure.query(async ({ ctx }) => {
    const entries = await ctx.db.query.journalEntry.findMany({
      where: (table, { eq: whereEq }) => whereEq(table.userId, ctx.user.id),
      with: {
        aiResponse: true,
      },
      orderBy: (table, { desc: orderDesc }) => orderDesc(table.createdAt),
    });

    return {
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
      },
      entries: entries.map((entry) => ({
        id: entry.id,
        mood: entry.mood,
        tags: entry.tags,
        note: entry.note,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        aiResponse: entry.aiResponse
          ? {
              response: entry.aiResponse.response,
              hasCrisisContent: entry.aiResponse.hasCrisisContent,
              createdAt: entry.aiResponse.createdAt,
            }
          : null,
      })),
      exportedAt: new Date().toISOString(),
    };
  }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.dbDirect.delete(userTable).where(eq(userTable.id, ctx.user.id));

    return { success: true as const };
  }),
});
