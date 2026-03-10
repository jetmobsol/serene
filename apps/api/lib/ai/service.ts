/**
 * Shared AI vibe check pipeline.
 *
 * Single source of truth for the AI generation logic used by both
 * the tRPC mutation (routers/ai.ts) and the SSE streaming endpoint.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { TRPCContext } from "../context.js";
import {
  AI_MAX_TOKENS,
  AI_MODEL,
  AI_TEMPERATURE,
  getAnthropic,
  persistAiResponse,
} from "./anthropic.js";
import { buildVibeCheckPrompt } from "./prompts.js";
import {
  FALLBACK_RESPONSE,
  GENERIC_RESPONSE,
  detectAiCrisis,
  detectKeywordCrisis,
  isGibberish,
  prependCrisisDisclaimer,
  stripCrisisMarker,
} from "./safety.js";

export interface VibeCheckResult {
  response: string;
  hasCrisisContent: boolean;
}

interface VibeCheckEntry {
  id: string;
  mood: string;
  tags: string[] | null;
  note: string | null;
}

interface VibeCheckDeps {
  db: TRPCContext["dbDirect"];
  env: TRPCContext["env"];
  cache: TRPCContext["cache"];
}

/**
 * Pre-checks the entry and returns early result for gibberish input.
 * Returns null if the entry should proceed to AI generation.
 */
export async function preCheckEntry(
  dbDirect: TRPCContext["dbDirect"],
  entry: VibeCheckEntry,
): Promise<VibeCheckResult | null> {
  const note = entry.note ?? "";

  if (isGibberish(note)) {
    const [persisted] = await persistAiResponse(dbDirect, {
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

  return null;
}

/**
 * Builds the prompt and detects keyword-level crisis flags.
 * Returns everything needed to call the Anthropic API.
 */
export function prepareVibeCheck(entry: VibeCheckEntry) {
  const note = entry.note ?? "";
  const keywordCrisisFlag = detectKeywordCrisis(note);
  const prompt = buildVibeCheckPrompt(entry.mood, entry.tags ?? [], note);

  return { prompt, keywordCrisisFlag, note };
}

/**
 * Post-processes the AI response: crisis detection, marker cleanup, persistence.
 */
export async function finalizeVibeCheck(
  dbDirect: TRPCContext["dbDirect"],
  entryId: string,
  rawResponse: string,
  keywordCrisisFlag: boolean,
): Promise<VibeCheckResult> {
  const aiCrisisFlag = detectAiCrisis(rawResponse);
  const hasCrisisContent = keywordCrisisFlag || aiCrisisFlag;

  let finalResponse = stripCrisisMarker(rawResponse);
  if (hasCrisisContent) {
    finalResponse = prependCrisisDisclaimer(finalResponse);
  }

  const [persisted] = await persistAiResponse(dbDirect, {
    entryId,
    response: finalResponse,
    hasCrisisContent,
    model: AI_MODEL,
  });

  return {
    response: persisted.response,
    hasCrisisContent: persisted.hasCrisisContent,
  };
}

/**
 * Full non-streaming vibe check: pre-check → prompt → Anthropic → finalize.
 *
 * Used by the tRPC mutation endpoint.
 */
export async function generateVibeCheck(
  deps: VibeCheckDeps,
  entry: VibeCheckEntry,
): Promise<VibeCheckResult> {
  // Gibberish short-circuit
  const earlyResult = await preCheckEntry(deps.db, entry);
  if (earlyResult) return earlyResult;

  const { prompt, keywordCrisisFlag } = prepareVibeCheck(entry);

  // Call Anthropic (non-streaming)
  let responseText: string;
  try {
    const anthropic = getAnthropic({ env: deps.env, cache: deps.cache });
    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      temperature: AI_TEMPERATURE,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    responseText = textBlock?.text ?? FALLBACK_RESPONSE;
  } catch (error) {
    console.error("Anthropic API error:", error);
    responseText = FALLBACK_RESPONSE;
  }

  return finalizeVibeCheck(deps.db, entry.id, responseText, keywordCrisisFlag);
}

/**
 * Creates an Anthropic streaming instance for the entry.
 *
 * Used by the SSE streaming endpoint. The caller handles the stream
 * events and calls `finalizeVibeCheck` when done.
 */
export function createVibeCheckStream(
  apiKey: string,
  prompt: { system: string; user: string },
): ReturnType<InstanceType<typeof Anthropic>["messages"]["stream"]> {
  const anthropic = new Anthropic({ apiKey });

  return anthropic.messages.stream({
    model: AI_MODEL,
    max_tokens: AI_MAX_TOKENS,
    temperature: AI_TEMPERATURE,
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
  });
}

// Re-export constants needed by stream handler
export { AI_MODEL, FALLBACK_RESPONSE, GENERIC_RESPONSE };
