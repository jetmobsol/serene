# 8. AI Integration Specification

> **Context:** Anthropic client setup, system prompt, streaming implementation, safety guardrails, cost estimation. Use `/claude-api` skill when implementing this section.

---

## 8.1 Anthropic Client Setup

**File:** `apps/api/lib/anthropic.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { TRPCContext } from "./context";

type AnthropicContext = Pick<TRPCContext, "env" | "cache">;

const ANTHROPIC_CLIENT = Symbol("anthropicClient");

export function getAnthropic(ctx: AnthropicContext): Anthropic {
  if (ctx.cache.has(ANTHROPIC_CLIENT)) {
    return ctx.cache.get(ANTHROPIC_CLIENT) as Anthropic;
  }

  const client = new Anthropic({
    apiKey: ctx.env.ANTHROPIC_API_KEY,
  });

  ctx.cache.set(ANTHROPIC_CLIENT, client);
  return client;
}
```

This follows the exact same request-scoped caching pattern as the existing `apps/api/lib/ai.ts` (OpenAI provider).

## 8.2 Environment Variable Addition

Add to `apps/api/lib/env.ts` envSchema:
```typescript
ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
```

Add to `.env.example`:
```
# Anthropic Claude API
# https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

## 8.3 System Prompt Construction

**File:** `apps/api/lib/prompts.ts`

```typescript
export function buildVibeCheckPrompt(
  mood: string,
  tags: string[],
  note: string,
): { system: string; user: string } {
  const system = `You are Serene's AI companion -- a warm, supportive, and non-judgmental presence.
Your role is to acknowledge the user's emotional state and offer brief encouragement.

Rules:
1. Respond in 1-2 sentences only. Be concise but genuine.
2. Reference the user's specific mood, tags, and note content. Do not give generic advice.
3. Use a warm, conversational tone. Avoid clinical language (no "therapy", "diagnosis", "treatment").
4. Never claim to be a therapist or mental health professional.
5. Focus on validation and gentle encouragement, not problem-solving.
6. If the user expresses a positive mood, celebrate with them.
7. If the user expresses a negative mood, acknowledge the difficulty and normalize the feeling.
8. Do not ask questions. Your response is a statement of support, not a conversation opener.`;

  const tagList = tags.length > 0 ? tags.join(", ") : "none selected";
  const user = `Mood: ${mood}\nContext Tags: ${tagList}\nJournal Note: ${note}`;

  return { system, user };
}
```

## 8.4 Streaming Implementation

The streaming vibe check uses the Anthropic SDK's native streaming support:

```typescript
const stream = await anthropic.messages.stream({
  model: "claude-sonnet-4-20250514",
  max_tokens: 150,
  temperature: 0.7,
  system: prompt.system,
  messages: [{ role: "user", content: prompt.user }],
});
```

The Hono handler converts this to SSE:
```typescript
app.get("/api/ai/stream/:entryId", async (c) => {
  // ... auth + entry validation ...
  return c.newResponse(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const event of stream) {
          if (event.type === "content_block_delta" &&
              event.delta.type === "text_delta") {
            controller.enqueue(
              encoder.encode(`event: token\ndata: ${JSON.stringify({
                text: event.delta.text
              })}\n\n`)
            );
          }
        }
        // ... persist response, send done event ...
        controller.close();
      }
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    }
  );
});
```

## 8.5 Rate Limiting

- Maximum 20 AI vibe check requests per user per hour.
- Implemented via a simple in-memory counter per user ID (acceptable for single-worker deployment).
- Returns `429 Too Many Requests` with retry-after header when exceeded.

## 8.6 Cost Estimation

- Average input: ~200 tokens (system prompt + mood + tags + note).
- Average output: ~50 tokens (1-2 sentences).
- Claude Sonnet cost: ~$3/M input tokens, ~$15/M output tokens.
- At 100 DAU with 3 entries/day = 300 requests/day = ~9,000/month.
- Estimated monthly cost: ~$7-12 (well within hobby-tier budget).
