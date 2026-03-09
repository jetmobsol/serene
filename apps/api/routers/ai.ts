import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AI_MAX_TOKENS,
  AI_MODEL,
  AI_TEMPERATURE,
  getAnthropic,
  persistAiResponse,
} from "../lib/anthropic.js";
import { buildVibeCheckPrompt } from "../lib/prompts.js";
import { checkRateLimit } from "../lib/rate-limit.js";
import {
  FALLBACK_RESPONSE,
  GENERIC_RESPONSE,
  detectAiCrisis,
  detectKeywordCrisis,
  isGibberish,
  prependCrisisDisclaimer,
  stripCrisisMarker,
} from "../lib/safety.js";
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

      // 3. Gibberish detection
      const note = entry.note ?? "";
      if (isGibberish(note)) {
        const [persisted] = await persistAiResponse(ctx.dbDirect, {
          entryId: entry.id,
          response: GENERIC_RESPONSE,
          hasCrisisContent: false,
          model: "none",
        });

        return {
          response: persisted.response,
          hasCrisisContent: persisted.hasCrisisContent,
        };
      }

      // 4. Layer 1: Keyword crisis pre-screen
      const keywordCrisisFlag = detectKeywordCrisis(note);

      // 5. Build prompt and call Anthropic
      const prompt = buildVibeCheckPrompt(entry.mood, entry.tags ?? [], note);

      let responseText: string;
      try {
        const anthropic = getAnthropic(ctx);
        const message = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: AI_MAX_TOKENS,
          temperature: AI_TEMPERATURE,
          system: prompt.system,
          messages: [{ role: "user", content: prompt.user }],
        });

        const textBlock = message.content.find(
          (block) => block.type === "text",
        );
        responseText = textBlock?.text ?? FALLBACK_RESPONSE;
      } catch (error) {
        console.error("Anthropic API error:", error);
        responseText = FALLBACK_RESPONSE;
      }

      // 6. Layer 2: AI crisis marker detection
      const aiCrisisFlag = detectAiCrisis(responseText);
      const hasCrisisContent = keywordCrisisFlag || aiCrisisFlag;

      // 7. Clean response text
      let finalResponse = stripCrisisMarker(responseText);
      if (hasCrisisContent) {
        finalResponse = prependCrisisDisclaimer(finalResponse);
      }

      // 8. Persist AI response (upsert)
      const [persisted] = await persistAiResponse(ctx.dbDirect, {
        entryId: entry.id,
        response: finalResponse,
        hasCrisisContent,
        model: AI_MODEL,
      });

      return {
        response: persisted.response,
        hasCrisisContent: persisted.hasCrisisContent,
      };
    }),
});
