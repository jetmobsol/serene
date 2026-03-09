/**
 * @file Hono app construction and tRPC router initialization.
 *
 * Combines authentication, tRPC, and health check endpoints into a single HTTP router.
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { streamSSE } from "hono/streaming";
import type { AppContext } from "./context.js";
import { router } from "./trpc.js";
import {
  AI_MAX_TOKENS,
  AI_MODEL,
  AI_TEMPERATURE,
  persistAiResponse,
} from "./anthropic.js";
import { buildVibeCheckPrompt } from "./prompts.js";
import { checkRateLimit } from "./rate-limit.js";
import {
  detectKeywordCrisis,
  detectAiCrisis,
  stripCrisisMarker,
  prependCrisisDisclaimer,
  isGibberish,
  GENERIC_RESPONSE,
  FALLBACK_RESPONSE,
} from "./safety.js";
import { aiRouter } from "../routers/ai.js";
import { billingRouter } from "../routers/billing.js";
import { journalRouter } from "../routers/journal.js";
import { organizationRouter } from "../routers/organization.js";
import { userRouter } from "../routers/user.js";

// tRPC API router
const appRouter = router({
  ai: aiRouter,
  billing: billingRouter,
  journal: journalRouter,
  user: userRouter,
  organization: organizationRouter,
});

// HTTP router
const app = new Hono<AppContext>();

app.get("/", (c) => c.redirect("/api"));

// Root endpoint with API information
app.get("/api", (c) => {
  return c.json({
    name: "@repo/api",
    version: "0.0.0",
    endpoints: {
      trpc: "/api/trpc",
      auth: "/api/auth",
      health: "/health",
      aiStream: "/api/ai/stream/:entryId",
    },
    documentation: {
      trpc: "https://trpc.io",
      auth: "https://www.better-auth.com",
    },
  });
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Authentication routes
app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const auth = c.get("auth");
  if (!auth) {
    return c.json({ error: "Authentication service not initialized" }, 503);
  }
  return auth.handler(c.req.raw);
});

// SSE streaming endpoint for AI vibe check
app.get("/api/ai/stream/:entryId", async (c) => {
  // 1. Authenticate via Better Auth session
  const auth = c.get("auth");
  if (!auth) {
    return c.json({ error: "Authentication service not initialized" }, 503);
  }

  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!sessionData?.session || !sessionData?.user) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const { user } = sessionData;
  const entryId = c.req.param("entryId");

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

  const note = entry.note ?? "";

  // 4. Gibberish check — return immediately without streaming
  if (isGibberish(note)) {
    await persistAiResponse(dbDirect, {
      entryId: entry.id,
      response: GENERIC_RESPONSE,
      hasCrisisContent: false,
      model: "none",
    });

    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        data: JSON.stringify({ text: GENERIC_RESPONSE }),
        event: "token",
      });
      await stream.writeSSE({
        data: JSON.stringify({
          response: GENERIC_RESPONSE,
          hasCrisisContent: false,
        }),
        event: "done",
      });
    });
  }

  // 5. Layer 1: Keyword crisis pre-screen
  const keywordCrisisFlag = detectKeywordCrisis(note);

  // 6. Build prompt
  const prompt = buildVibeCheckPrompt(entry.mood, entry.tags ?? [], note);

  // 7. Stream from Anthropic
  return streamSSE(c, async (stream) => {
    let anthropicStream: ReturnType<
      InstanceType<typeof Anthropic>["messages"]["stream"]
    > | null = null;
    let accumulatedText = "";
    let aborted = false;

    // 10s timeout
    const timeoutId = setTimeout(() => {
      aborted = true;
      anthropicStream?.abort();
    }, 10_000);

    // Client disconnect handler
    stream.onAbort(() => {
      aborted = true;
      anthropicStream?.abort();
      clearTimeout(timeoutId);
    });

    try {
      if (!c.env.ANTHROPIC_API_KEY) {
        throw new Error(
          "ANTHROPIC_API_KEY is not configured. AI features are unavailable.",
        );
      }
      const anthropic = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

      anthropicStream = anthropic.messages.stream({
        model: AI_MODEL,
        max_tokens: AI_MAX_TOKENS,
        temperature: AI_TEMPERATURE,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      });

      // Process text events
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
        // Timeout with no content — persist fallback
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

      // Use whatever text we have (partial on timeout, full on completion)
      const responseText =
        accumulatedText.length > 0 ? accumulatedText : FALLBACK_RESPONSE;

      // Layer 2: AI crisis marker detection
      const aiCrisisFlag = detectAiCrisis(responseText);
      const hasCrisisContent = keywordCrisisFlag || aiCrisisFlag;

      // Clean and format response
      let finalResponse = stripCrisisMarker(responseText);
      if (hasCrisisContent) {
        finalResponse = prependCrisisDisclaimer(finalResponse);
      }

      // Persist AI response
      await persistAiResponse(dbDirect, {
        entryId: entry.id,
        response: finalResponse,
        hasCrisisContent,
        model: AI_MODEL,
      });

      // Send done event
      if (!aborted) {
        await stream.writeSSE({
          data: JSON.stringify({ response: finalResponse, hasCrisisContent }),
          event: "done",
        });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("AI stream error:", error);

      // Persist fallback response on error
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

// tRPC API routes
app.use("/api/trpc/*", (c) => {
  return fetchRequestHandler({
    req: c.req.raw,
    router: appRouter,
    endpoint: "/api/trpc",
    async createContext({ req, resHeaders, info }) {
      const db = c.get("db");
      const dbDirect = c.get("dbDirect");
      const auth = c.get("auth");

      if (!db) {
        throw new Error("Database not available in context");
      }

      if (!dbDirect) {
        throw new Error("Direct database not available in context");
      }

      if (!auth) {
        throw new Error("Authentication service not available in context");
      }

      const sessionData = await auth.api.getSession({
        headers: req.headers,
      });

      return {
        req,
        res: c.res,
        resHeaders,
        info,
        env: c.env,
        db,
        dbDirect,
        session: sessionData?.session ?? null,
        user: sessionData?.user ?? null,
        cache: new Map(),
      };
    },
    batching: {
      enabled: true,
    },
    onError({ error, path }) {
      console.error("tRPC error on path", path, ":", error);
    },
  });
});

export { appRouter };
export type AppRouter = typeof appRouter;
export default app;
