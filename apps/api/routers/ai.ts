import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { checkRateLimit } from "../lib/ai/rate-limit.js";
import { generateVibeCheck } from "../lib/ai/service.js";
import { protectedProcedure, router } from "../lib/trpc.js";

export const aiRouter = router({
  generateVibeCheck: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch entry and validate ownership
      const entry = await ctx.db.query.journalEntry.findFirst({
        where: (table, { eq: whereEq, and: whereAnd }) =>
          whereAnd(
            whereEq(table.id, input.entryId),
            whereEq(table.userId, ctx.user.id),
          ),
      });

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // 2. Rate limiting
      const rateLimit = await checkRateLimit(
        ctx.env.AI_RATE_LIMIT,
        ctx.user.id,
      );

      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
        });
      }

      // 3. Generate vibe check (shared pipeline)
      return generateVibeCheck(
        { db: ctx.dbDirect, env: ctx.env, cache: ctx.cache },
        entry,
      );
    }),
});
