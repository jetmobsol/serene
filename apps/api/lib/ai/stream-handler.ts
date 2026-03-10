/**
 * SSE streaming endpoint for AI vibe check.
 *
 * Extracted from app.ts to keep HTTP routing separate from AI business logic.
 */

import type { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { AppContext } from "../context.js";
import { checkRateLimit } from "./rate-limit.js";
import { persistAiResponse } from "./anthropic.js";
import {
  AI_MODEL,
  FALLBACK_RESPONSE,
  GENERIC_RESPONSE,
  preCheckEntry,
  prepareVibeCheck,
  createVibeCheckStream,
  finalizeVibeCheck,
} from "./service.js";

export function registerAiStreamRoute(app: Hono<AppContext>) {
  app.get("/api/ai/stream/:entryId", async (c) => {
    const entryId = c.req.param("entryId");
    console.log(`\n🔵 AI STREAM REQUEST received for entry: ${entryId}`);

    // 1. Authenticate via Better Auth session
    const auth = c.get("auth");
    if (!auth) {
      console.log(`  ❌ Auth service not initialized`);
      return c.json({ error: "Authentication service not initialized" }, 503);
    }

    const sessionData = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      console.log(`  ❌ Auth failed — no session/user`);
      return c.json({ error: "Authentication required" }, 401);
    }
    console.log(`  ✅ Authenticated as ${sessionData.user.email}`);

    const { user } = sessionData;

    // 2. Rate limiting
    const rateLimit = await checkRateLimit(c.env.AI_RATE_LIMIT, user.id);
    if (!rateLimit.allowed) {
      return c.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
      );
    }

    // 3. Fetch entry and validate ownership
    const db = c.get("db");
    const dbDirect = c.get("dbDirect");

    const entry = await db.query.journalEntry.findFirst({
      where: (table, { eq: whereEq, and: whereAnd }) =>
        whereAnd(whereEq(table.id, entryId), whereEq(table.userId, user.id)),
    });

    if (!entry) {
      return c.json({ error: "Entry not found" }, 404);
    }

    // 4. Gibberish check — return immediately without streaming
    const earlyResult = await preCheckEntry(dbDirect, entry);
    if (earlyResult) {
      console.log(
        `  ⏭️  Skipping Anthropic — gibberish detected, returning generic response`,
      );
      return streamSSE(c, async (stream) => {
        await stream.writeSSE({
          data: JSON.stringify({ text: GENERIC_RESPONSE }),
          event: "token",
        });
        await stream.writeSSE({
          data: JSON.stringify({
            response: earlyResult.response,
            hasCrisisContent: earlyResult.hasCrisisContent,
          }),
          event: "done",
        });
      });
    }

    // 5. Prepare prompt and crisis flags
    const { prompt, keywordCrisisFlag, note } = prepareVibeCheck(entry);

    console.log(
      `\n🤖 AI VIBE CHECK REQUEST\n` +
        `  Entry:       ${entryId}\n` +
        `  Mood:        ${entry.mood}\n` +
        `  Tags:        ${(entry.tags ?? []).join(", ") || "(none)"}\n` +
        `  Note:        ${note.slice(0, 120)}${note.length > 120 ? "..." : ""}\n` +
        `  Crisis flag: ${keywordCrisisFlag}\n` +
        `  Model:       ${AI_MODEL}\n` +
        `  System:      ${prompt.system.slice(0, 200)}...\n` +
        `  User prompt: ${prompt.user}`,
    );

    // 6. Stream from Anthropic
    return streamSSE(c, async (stream) => {
      let anthropicStream: ReturnType<typeof createVibeCheckStream> | null =
        null;
      let accumulatedText = "";
      let aborted = false;

      const timeoutId = setTimeout(() => {
        aborted = true;
        anthropicStream?.abort();
      }, 10_000);

      stream.onAbort(() => {
        aborted = true;
        anthropicStream?.abort();
        clearTimeout(timeoutId);
      });

      try {
        if (!c.env.ANTHROPIC_API_KEY) {
          console.log(`  ❌ ANTHROPIC_API_KEY not set`);
          throw new Error(
            "ANTHROPIC_API_KEY is not configured. AI features are unavailable.",
          );
        }
        console.log(`  🚀 Calling Anthropic API (${AI_MODEL})...`);

        anthropicStream = createVibeCheckStream(
          c.env.ANTHROPIC_API_KEY,
          prompt,
        );

        for await (const event of anthropicStream) {
          if (aborted) break;

          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            accumulatedText += event.delta.text;
            await stream.writeSSE({
              data: JSON.stringify({ text: event.delta.text }),
              event: "token",
            });
          }
        }

        clearTimeout(timeoutId);

        if (aborted && accumulatedText.length === 0) {
          await persistAiResponse(dbDirect, {
            entryId: entry.id,
            response: FALLBACK_RESPONSE,
            hasCrisisContent: false,
            model: AI_MODEL,
          });

          await stream.writeSSE({
            data: JSON.stringify({ message: "Request timed out" }),
            event: "error",
          });
          return;
        }

        const responseText =
          accumulatedText.length > 0 ? accumulatedText : FALLBACK_RESPONSE;

        const result = await finalizeVibeCheck(
          dbDirect,
          entry.id,
          responseText,
          keywordCrisisFlag,
        );

        console.log(
          `\n✅ AI VIBE CHECK RESPONSE\n` +
            `  Entry:    ${entryId}\n` +
            `  Crisis:   ${result.hasCrisisContent}\n` +
            `  Response: ${result.response}`,
        );

        if (!aborted) {
          await stream.writeSSE({
            data: JSON.stringify({
              response: result.response,
              hasCrisisContent: result.hasCrisisContent,
            }),
            event: "done",
          });
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("AI stream error:", error);

        await persistAiResponse(dbDirect, {
          entryId: entry.id,
          response: FALLBACK_RESPONSE,
          hasCrisisContent: keywordCrisisFlag,
          model: AI_MODEL,
        });

        if (!aborted) {
          await stream.writeSSE({
            data: JSON.stringify({
              message:
                error instanceof Error ? error.message : "An error occurred",
            }),
            event: "error",
          });
        }
      }
    });
  });
}
