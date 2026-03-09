import Anthropic from "@anthropic-ai/sdk";
import { aiResponse } from "@repo/db/schema/ai-response.js";
import type { TRPCContext } from "./context.js";

export const AI_MODEL = "claude-sonnet-4-20250514";
export const AI_MAX_TOKENS = 150;
export const AI_TEMPERATURE = 0.7;

type AnthropicContext = Pick<TRPCContext, "env" | "cache">;

const ANTHROPIC_CLIENT = Symbol("anthropicClient");

/**
 * Returns a request-scoped Anthropic client.
 *
 * Caches the client instance in `ctx.cache` so that multiple calls
 * within the same request reuse the same client.
 *
 * @throws {Error} When ANTHROPIC_API_KEY is not configured
 */
export function getAnthropic(ctx: AnthropicContext): Anthropic {
  if (ctx.cache.has(ANTHROPIC_CLIENT)) {
    return ctx.cache.get(ANTHROPIC_CLIENT) as Anthropic;
  }

  if (!ctx.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. AI features are unavailable.",
    );
  }

  const client = new Anthropic({
    apiKey: ctx.env.ANTHROPIC_API_KEY,
  });
  ctx.cache.set(ANTHROPIC_CLIENT, client);
  return client;
}

/**
 * Upserts an AI response for a journal entry.
 *
 * Uses Drizzle's `onConflictDoUpdate` targeting the `entryId` unique
 * constraint so re-generating a vibe check replaces the previous one.
 */
export async function persistAiResponse(
  dbDirect: TRPCContext["dbDirect"],
  params: {
    entryId: string;
    response: string;
    hasCrisisContent: boolean;
    model: string;
  },
) {
  const { entryId, response, hasCrisisContent, model } = params;
  return dbDirect
    .insert(aiResponse)
    .values({ entryId, response, hasCrisisContent, model })
    .onConflictDoUpdate({
      target: aiResponse.entryId,
      set: { response, hasCrisisContent, model },
    })
    .returning();
}
