# AI Vibe Check API - Implementation Plan

**Status**: READY FOR IMPLEMENTATION
**Created**: 2026-03-09

## Summary

Implement the AI Vibe Check backend: an Anthropic Claude integration that generates empathetic, context-aware reflections for journal entries. The system includes dual-layer crisis detection (keyword pre-screen + AI marker parsing), gibberish filtering, SSE streaming via a Hono endpoint, KV-based rate limiting (20 req/hour), and a tRPC mutation for non-streaming use. All new modules are unit-tested with mocked Anthropic calls following the existing `createCallerFactory` test pattern.

## Files

> **Note**: This is the canonical file list. The `## Implementation Plan` section below references these same files with detailed implementation instructions.

### Files to Edit

- `apps/api/package.json`
- `apps/api/lib/env.ts`
- `apps/api/lib/app.ts`
- `apps/api/worker.ts`
- `apps/api/dev.ts`
- `apps/api/wrangler.jsonc`

### Files to Create

- `apps/api/lib/anthropic.ts`
- `apps/api/lib/safety.ts`
- `apps/api/lib/prompts.ts`
- `apps/api/lib/rate-limit.ts`
- `apps/api/routers/ai.ts`
- `apps/api/lib/safety.test.ts`
- `apps/api/lib/prompts.test.ts`
- `apps/api/routers/ai.test.ts`

---

## Code Context

### Existing Architecture

**tRPC Setup** (`apps/api/lib/trpc.ts`):

- `publicProcedure` and `protectedProcedure` defined via `initTRPC.context<TRPCContext>()`
- `protectedProcedure` middleware narrows `ctx.session` and `ctx.user` to non-null
- `createCallerFactory` exported for test caller creation
- Error formatter extracts Zod errors

**Context** (`apps/api/lib/context.ts:30-60`):

- `TRPCContext` has: `req`, `info`, `db`, `dbDirect`, `session`, `user`, `cache: Map<string | symbol, unknown>`, `env: Env`
- `AppContext` for Hono: `Bindings: Env`, `Variables: { db, dbDirect, auth, resend?, session, user }`

**App Router** (`apps/api/lib/app.ts:17-22`):

- `appRouter = router({ billing, journal, user, organization })`
- tRPC context created in `/api/trpc/*` handler (lines 60-107) with `createContext` extracting db, auth, session from Hono context
- SSE endpoint will be added as a Hono route BEFORE the tRPC handler

**Worker Entry** (`apps/api/worker.ts:22-57`):

- `CloudflareEnv = { HYPERDRIVE_CACHED, HYPERDRIVE_DIRECT } & Env`
- Middleware sets `db`, `dbDirect`, `auth` on context
- KV namespace `AI_RATE_LIMIT` will be added to `CloudflareEnv`

**Dev Server** (`apps/api/dev.ts:27-93`):

- Same `CloudflareEnv` pattern; merges `process.env` secrets with CF bindings
- `ANTHROPIC_API_KEY` already in secretKeys array (line 63)
- `getPlatformProxy` provides local KV simulation via `.wrangler` directory

**Env Schema** (`apps/api/lib/env.ts:9-26`):

- `ANTHROPIC_API_KEY: z.string().optional()` at line 17
- Needs to remain optional (app works without AI features) but add format validation

**Journal Router** (`apps/api/routers/journal.ts:99-118`):

- `getById` fetches entry with `{ with: { aiResponse: true } }` and enforces `userId` ownership
- Entry shape: `{ id, userId, mood, tags: string[], note, createdAt, updatedAt, aiResponse: AiResponse | null }`

**AI Response Schema** (`db/schema/ai-response.ts:8-22`):

- `aiResponse` table: `id` (text PK, prefix "air"), `entryId` (unique FK to journalEntry), `response` (text), `hasCrisisContent` (boolean), `model` (text), `createdAt` (timestamp)
- Upsert via `onConflictDoUpdate` on `entryId` unique constraint

**Test Pattern** (`apps/api/routers/journal.test.ts:12-70`):

- `testCtx()` factory creates full `TRPCContext` mock
- `db` mock: `{ query: { journalEntry: { findMany, findFirst } } }`
- `dbDirect` mock: chain `insert().values().returning()`, `update().set().where().returning()`, `delete().where()`
- Uses `vi.fn().mockResolvedValue()` and `vi.fn().mockReturnValue()`
- `env: {} as TRPCContext["env"]` for minimal env mock

**Request-scoped Cache Pattern** (`apps/api/lib/loaders.ts:29-41`):

- `defineLoader(symbol, batchFn)` creates DataLoaders cached per-request via `ctx.cache`
- Same pattern used for Anthropic client in `apps/api/lib/anthropic.ts`

**Stripe Client Pattern** (`apps/api/lib/stripe.ts:1-9`):

- Simple factory: `createStripeClient(env: Pick<Env, "STRIPE_SECRET_KEY">) => Stripe`
- Not request-scoped (called once per auth init)
- Anthropic client will follow cache-based pattern from PRD instead

### Shared Constants (`packages/core/journal.ts`):

- `MOODS = ["Happy", "Calm", "Anxious", "Sad", "Overwhelmed", "Angry"] as const`
- `TAGS = ["Work", "Sleep", "Relationships", "Fitness", "Hobbies", "Health", "Social", "Nature"] as const`

---

## External Context

### Anthropic SDK (`@anthropic-ai/sdk`)

**Installation**: `bun add @anthropic-ai/sdk` in `apps/api`

**Client Initialization**:

```typescript
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ apiKey: "sk-ant-..." });
```

**Streaming API** (`client.messages.stream()`):

```typescript
const stream = client.messages.stream({
  model: "claude-sonnet-4-20250514",
  max_tokens: 150,
  temperature: 0.7,
  system: "system prompt here",
  messages: [{ role: "user", content: "user message" }],
});

// Event-based consumption:
stream.on("text", (textDelta: string, textSnapshot: string) => {
  /* partial text */
});
stream.on("message", (message: Message) => {
  /* complete message */
});
stream.on("error", (error: AnthropicError) => {
  /* handle error */
});

// Utility methods:
const finalMessage = await stream.finalMessage();
const finalText = await stream.finalText();
stream.abort(); // equivalent to stream.controller.abort()
stream.controller; // underlying AbortController
```

**Non-streaming API** (`client.messages.create()`):

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 150,
  temperature: 0.7,
  system: "system prompt",
  messages: [{ role: "user", content: "user content" }],
});
// message.content[0].text contains the response text
```

### Hono SSE Helper (`hono/streaming`)

```typescript
import { streamSSE } from "hono/streaming";

app.get("/sse", async (c) => {
  return streamSSE(c, async (stream) => {
    stream.onAbort(() => {
      /* client disconnected */
    });
    await stream.writeSSE({ data: "hello", event: "token", id: "1" });
    stream.close();
  });
});
```

### Cloudflare KV (Workers Types)

```typescript
// KVNamespace is a global type from @cloudflare/workers-types
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}
```

---

## Architectural Narrative

### Task

Implement the AI Vibe Check API that generates empathetic, context-aware reflections for journal entries using Anthropic Claude. The system must:

1. Accept a journal entry ID, fetch the entry, validate ownership
2. Detect gibberish input and return a generic response without calling AI
3. Run dual-layer crisis detection (keyword pre-screen + AI `[CRISIS_DETECTED]` marker)
4. Stream responses via SSE with `token`, `done`, and `error` events
5. Rate limit to 20 requests per user per hour via Cloudflare KV
6. Handle 10s timeout, client disconnects, and Anthropic API errors gracefully
7. Persist the AI response to the `aiResponse` table (upsert on `entryId`)
8. Provide a tRPC mutation for non-streaming use

### Architecture

The AI feature adds four new library modules (`anthropic.ts`, `safety.ts`, `prompts.ts`, `rate-limit.ts`), one tRPC router (`ai.ts`), and one SSE Hono route in `app.ts`. The tRPC mutation handles the full flow synchronously; the SSE endpoint streams tokens in real-time.

Data flow:

```
Client -> SSE GET /api/ai/stream/:entryId
  -> Auth check (Better Auth session from headers)
  -> Rate limit check (KV)
  -> Fetch entry + ownership check (DB)
  -> Gibberish check (safety.ts)
  -> [if gibberish] -> generic response SSE done event -> persist
  -> [if real] -> Keyword crisis pre-screen (safety.ts)
  -> Build prompt (prompts.ts)
  -> Stream from Anthropic (anthropic.ts)
  -> Parse [CRISIS_DETECTED] from accumulated text (safety.ts)
  -> SSE token events -> SSE done event -> persist to DB
```

### Selected Context

- `apps/api/lib/context.ts:30-60` — TRPCContext type with `cache`, `env`, `db`, `dbDirect`, `session`, `user`
- `apps/api/lib/trpc.ts:51-67` — `protectedProcedure` narrows session/user to non-null
- `apps/api/lib/app.ts:17-22` — Router composition, SSE route insertion point (before tRPC handler)
- `apps/api/lib/loaders.ts:29-41` — `defineLoader` pattern for request-scoped caching via `ctx.cache`
- `apps/api/worker.ts:22-26` — `CloudflareEnv` type extension pattern
- `apps/api/dev.ts:44-48` — `getPlatformProxy` for local KV simulation
- `db/schema/ai-response.ts:8-22` — `aiResponse` table with `entryId` unique constraint for upserts
- `apps/api/routers/journal.ts:99-118` — `getById` pattern for entry fetch + ownership enforcement
- `apps/api/routers/journal.test.ts:12-70` — `testCtx()` factory pattern for test mocking

### Relationships

- `anthropic.ts` depends on `context.ts` (for `TRPCContext` cache pattern) and `env.ts` (for `Env` type)
- `safety.ts` is standalone (pure functions, no external deps)
- `prompts.ts` is standalone (pure functions, no external deps)
- `rate-limit.ts` depends on `env.ts` (for `Env` type with KV binding)
- `ai.ts` router depends on all four lib modules + `trpc.ts` + `db/schema/ai-response.ts` + `db/schema/journal.ts`
- `app.ts` depends on `ai.ts` (router registration) + `anthropic.ts` + `safety.ts` + `prompts.ts` + `rate-limit.ts` (SSE endpoint)
- `worker.ts` and `dev.ts` depend on updated `CloudflareEnv` type with KV namespace
- `context.ts` depends on updated `Env` type with KV namespace

### External Context

- Anthropic SDK `messages.stream()` returns a `MessageStream` with `.on("text", (delta, snapshot))` for partial tokens, `.on("message", msg)` for completion, `.on("error", err)` for errors, and `.controller` for the `AbortController`
- Anthropic SDK `messages.create()` returns a `Message` with `content[0].text` for non-streaming
- Hono `streamSSE(c, async (stream) => { ... })` provides `stream.writeSSE({ data, event, id })`, `stream.onAbort(cb)`, and `stream.close()`
- Cloudflare KV `get(key)` returns `string | null`, `put(key, value, { expirationTtl })` sets with TTL in seconds

### Implementation Notes

1. **ANTHROPIC_API_KEY stays optional** in env schema: AI features gracefully degrade when the key is missing. The tRPC mutation and SSE endpoint should check for the key and return an error if missing.

2. **Rate limiting uses hour-bucket keys**: `ratelimit:ai:{userId}:{Math.floor(Date.now() / 3600000)}` with TTL of 7200 seconds (2 hours). Counter is a simple increment stored as string in KV.

3. **Crisis detection is dual-layer**: Layer 1 (keyword) runs before the AI call and sets `keywordCrisisFlag`. Layer 2 (AI marker) parses the accumulated response text for `[CRISIS_DETECTED]` prefix. Final `hasCrisisContent = keywordCrisisFlag || aiCrisisFlag`. When crisis is detected, a safety disclaimer is prepended to the response.

4. **Gibberish detection**: Count words > 2 chars that appear in a basic dictionary check. If fewer than 3 "real" words, return the generic response without calling AI. The implementation uses a simple heuristic: split on whitespace, filter words > 2 chars, check against a common English words set.

5. **SSE event format**:
   - `event: token` with `data: {"text": "partial text"}`
   - `event: done` with `data: {"response": "full text", "hasCrisisContent": false}`
   - `event: error` with `data: {"message": "error description"}`

6. **Timeout**: 10s `AbortController` wrapping the Anthropic stream. On timeout, send error SSE event and persist fallback message.

7. **Fallback message**: `"I wasn't able to generate a reflection right now. Remember, the act of journaling itself is a powerful step toward self-awareness."` — persisted with `hasCrisisContent: false`.

8. **AI model**: `claude-sonnet-4-20250514` with `max_tokens: 150` and `temperature: 0.7`.

9. **KV namespace access**: In tRPC context, KV is accessed via `ctx.env.AI_RATE_LIMIT`. In the Hono SSE handler, via `c.env.AI_RATE_LIMIT`. Both need the `AI_RATE_LIMIT` binding added to `Env` type and `wrangler.jsonc`.

10. **Upsert pattern for aiResponse**: Use Drizzle's `onConflictDoUpdate` targeting the `entryId` unique constraint: `db.insert(aiResponse).values({...}).onConflictDoUpdate({ target: aiResponse.entryId, set: { response, hasCrisisContent, model } })`.

### Ambiguities

1. **Dictionary for gibberish detection**: Rather than bundling a full dictionary, we use a curated set of ~200 common English words. This is a heuristic — not meant to be exhaustive. The threshold of 3 "real" words is generous enough to pass most legitimate journal entries.

2. **Rate limit in dev**: `getPlatformProxy` with `persist: true` provides local KV simulation. Rate limiting works in dev but resets on `.wrangler` directory cleanup.

3. **ANTHROPIC_API_KEY validation**: We keep it optional in the Zod schema but add `startsWith("sk-ant-")` validation when present. This allows the app to start without the key while validating format when provided.

### Requirements

1. AI vibe check generates 1-2 sentence empathetic responses referencing the user's mood, tags, and note
2. Crisis keyword detection (Layer 1) catches all 16 defined keywords/phrases
3. AI crisis detection (Layer 2) correctly parses `[CRISIS_DETECTED]` marker from response text
4. Combined crisis flag: `hasCrisisContent = keywordCrisisFlag || aiCrisisFlag`
5. Crisis responses include prepended safety disclaimer with hotline info
6. Gibberish detection returns generic response for notes with fewer than 3 dictionary words (words > 2 chars)
7. SSE endpoint sends `token`, `done`, and `error` events in correct format
8. Rate limiting via Cloudflare KV returns 429 with `Retry-After` header after 20 requests/hour
9. SSE streaming aborts after 10s timeout with error event and fallback persistence
10. Client disconnect detection stops AI streaming
11. Anthropic API errors handled gracefully with error SSE event and fallback persistence
12. AI response persisted to `aiResponse` table via upsert on `entryId`
13. Entry ownership enforced (user can only generate vibe checks for their own entries)
14. tRPC mutation provides non-streaming alternative with same logic
15. All tests pass with `bun test --run`

### Constraints

- Cloudflare Workers runtime: no Node.js-specific APIs except those allowed by `nodejs_compat`
- `@anthropic-ai/sdk` must be compatible with Cloudflare Workers (it is — uses fetch)
- KV namespace must be declared in `wrangler.jsonc` for all environments
- SSE endpoint is a Hono route (not tRPC) because tRPC does not natively support SSE streaming
- tRPC mutation is synchronous (waits for full response) — not suitable for long-running streams
- `prepare: false` required for all DB queries (Workers connection pooling)
- Must follow existing code style: double quotes, semicolons, trailing commas, 80 char width

### Selected Approach

**Approach**: Hybrid tRPC + Hono SSE with shared service functions

**Description**: All AI logic (entry fetching, validation, safety checks, Anthropic calls, DB persistence) lives in reusable functions within the library modules (`anthropic.ts`, `safety.ts`, `prompts.ts`, `rate-limit.ts`). The tRPC `ai.generateVibeCheck` mutation composes these for synchronous use. The Hono SSE endpoint at `GET /api/ai/stream/:entryId` composes them for streaming use. Both paths share the same validation, safety, and persistence logic — only the Anthropic call differs (`.create()` vs `.stream()`).

**Rationale**: This avoids duplicating business logic between the tRPC and SSE paths. The tRPC mutation is useful for server-side callers and testing; the SSE endpoint is the primary client-facing interface. Hono's `streamSSE` helper is purpose-built for SSE and handles content-type headers, connection lifecycle, and abort detection automatically.

**Trade-offs Accepted**: The SSE endpoint requires separate auth validation (cannot use `protectedProcedure` middleware). We extract auth from Better Auth headers directly in the Hono handler, mirroring what the tRPC context creation does. This is a small amount of duplication but keeps the SSE path clean and independent of tRPC.

---

## Implementation Plan

### apps/api/package.json [edit]

**Purpose**: Add `@anthropic-ai/sdk` dependency for Anthropic Claude API access.
**TOTAL CHANGES**: 1

**Changes**:

1. Add `@anthropic-ai/sdk` to `dependencies` object (after `@better-auth/stripe`, line 22)

**Implementation Details**:

- Package: `@anthropic-ai/sdk` at `^0.52.0` (latest compatible with Cloudflare Workers)
- This is a runtime dependency, not devDependency, because it runs in the Worker

**Migration Pattern**:

```json
// BEFORE (line 22-23):
    "@better-auth/stripe": "^1.4.18",
    "@repo/core": "workspace:*",

// AFTER:
    "@anthropic-ai/sdk": "^0.52.0",
    "@better-auth/stripe": "^1.4.18",
    "@repo/core": "workspace:*",
```

**Dependencies**: None
**Provides**: `@anthropic-ai/sdk` package available for import

---

### apps/api/lib/env.ts [edit]

**Purpose**: Update ANTHROPIC_API_KEY validation and add AI_RATE_LIMIT KV namespace type.
**TOTAL CHANGES**: 2

**Changes**:

1. Line 17: Change `ANTHROPIC_API_KEY` from `z.string().optional()` to `z.string().startsWith("sk-ant-").optional()` to validate format when provided
2. After line 25 (end of envSchema object): Add `AI_RATE_LIMIT` as an optional `z.custom<KVNamespace>()` field for the KV binding

**Implementation Details**:

- `AI_RATE_LIMIT` is typed as `KVNamespace` (global from `@cloudflare/workers-types`)
- It is optional because Bun runtime (local non-wrangler) does not have KV bindings; only Workers and `getPlatformProxy` provide them
- The `z.custom<KVNamespace>()` passes through the binding without validation (KV is not a string)

**Reference Implementation**:

```typescript
import { z } from "zod";

/**
 * Zod schema for validating environment variables.
 * Ensures all required configuration values are present and correctly formatted.
 *
 * @throws {ZodError} When environment variables don't match the schema
 */
export const envSchema = z.object({
  ENVIRONMENT: z.enum(["production", "staging", "preview", "development"]),
  APP_NAME: z.string().default("Example"),
  APP_ORIGIN: z.url(),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),
  RESEND_API_KEY: z.string(),
  RESEND_EMAIL_FROM: z.email(),
  // Stripe billing (optional — app works without these, billing features disabled)
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_STARTER_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PRO_PRICE_ID: z.string().startsWith("price_").optional(),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().startsWith("price_").optional(),
  // Cloudflare KV namespace for AI rate limiting (injected by Workers runtime)
  AI_RATE_LIMIT: z.custom<KVNamespace>().optional(),
});

/**
 * Runtime environment variables accessor.
 *
 * @remarks
 * - In Bun runtime: Variables are accessed via `Bun.env`
 * - In Cloudflare Workers: Variables must be accessed via request context
 * - Falls back to empty object when Bun global is unavailable
 */
export const env =
  typeof Bun === "undefined" ? ({} as Env) : envSchema.parse(Bun.env);

/**
 * Type-safe environment variables interface.
 * Inferred from the Zod schema to ensure type safety.
 */
export type Env = z.infer<typeof envSchema>;
```

**Migration Pattern**:

```typescript
// BEFORE (line 17):
  ANTHROPIC_API_KEY: z.string().optional(),

// AFTER:
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-").optional(),
```

```typescript
// BEFORE (lines 24-25):
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().startsWith("price_").optional(),
});

// AFTER:
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().startsWith("price_").optional(),
  // Cloudflare KV namespace for AI rate limiting (injected by Workers runtime)
  AI_RATE_LIMIT: z.custom<KVNamespace>().optional(),
});
```

**Dependencies**: None
**Provides**: Updated `Env` type with `ANTHROPIC_API_KEY: string | undefined` (format-validated) and `AI_RATE_LIMIT: KVNamespace | undefined`

---

### apps/api/wrangler.jsonc [edit]

**Purpose**: Add `AI_RATE_LIMIT` KV namespace binding for all environments.
**TOTAL CHANGES**: 4

**Changes**:

1. Line 27: Replace `"kv_namespaces": []` with KV namespace binding for production
2. Line 45: Replace `"kv_namespaces": []` with KV namespace binding for dev
3. Line 63: Replace `"kv_namespaces": []` with KV namespace binding for staging
4. Line 81: Replace `"kv_namespaces": []` with KV namespace binding for preview

**Implementation Details**:

- Each environment gets its own KV namespace ID (placeholder values — real IDs created via `wrangler kv namespace create`)
- Binding name is `AI_RATE_LIMIT` matching the `Env` type field
- Dev environment uses local KV simulation via `getPlatformProxy({ persist: true })`

**Reference Implementation**:

```jsonc
// Production (line 27):
"kv_namespaces": [
  { "binding": "AI_RATE_LIMIT", "id": "your-ai-rate-limit-kv-id-here" }
],

// Dev (line 45):
"kv_namespaces": [
  { "binding": "AI_RATE_LIMIT", "id": "your-dev-ai-rate-limit-kv-id-here" }
],

// Staging (line 63):
"kv_namespaces": [
  { "binding": "AI_RATE_LIMIT", "id": "your-staging-ai-rate-limit-kv-id-here" }
],

// Preview (line 81):
"kv_namespaces": [
  { "binding": "AI_RATE_LIMIT", "id": "your-preview-ai-rate-limit-kv-id-here" }
],
```

**Migration Pattern**:

```jsonc
// BEFORE (each environment):
  "kv_namespaces": []

// AFTER:
  "kv_namespaces": [
    { "binding": "AI_RATE_LIMIT", "id": "your-{env}-ai-rate-limit-kv-id-here" }
  ]
```

**Dependencies**: None
**Provides**: `AI_RATE_LIMIT` KV binding available in Workers runtime and `getPlatformProxy`

---

### apps/api/worker.ts [edit]

**Purpose**: Add `AI_RATE_LIMIT` KV namespace to the `CloudflareEnv` type.
**TOTAL CHANGES**: 1

**Changes**:

1. Line 22-25: Add `AI_RATE_LIMIT: KVNamespace` to the `CloudflareEnv` type

**Implementation Details**:

- `KVNamespace` is a global type from `@cloudflare/workers-types` (already a devDependency)
- The binding is injected by the Workers runtime from `wrangler.jsonc` configuration

**Reference Implementation**:

```typescript
type CloudflareEnv = {
  HYPERDRIVE_CACHED: Hyperdrive;
  HYPERDRIVE_DIRECT: Hyperdrive;
  AI_RATE_LIMIT: KVNamespace;
} & Env;
```

**Migration Pattern**:

```typescript
// BEFORE (lines 22-25):
type CloudflareEnv = {
  HYPERDRIVE_CACHED: Hyperdrive;
  HYPERDRIVE_DIRECT: Hyperdrive;
} & Env;

// AFTER:
type CloudflareEnv = {
  HYPERDRIVE_CACHED: Hyperdrive;
  HYPERDRIVE_DIRECT: Hyperdrive;
  AI_RATE_LIMIT: KVNamespace;
} & Env;
```

**Dependencies**: `apps/api/lib/env.ts` (updated `Env` type), `apps/api/wrangler.jsonc` (KV binding)
**Provides**: `AI_RATE_LIMIT` available on `c.env` in Hono handlers

---

### apps/api/dev.ts [edit]

**Purpose**: Add `AI_RATE_LIMIT` KV namespace to the dev `CloudflareEnv` type.
**TOTAL CHANGES**: 1

**Changes**:

1. Lines 27-30: Add `AI_RATE_LIMIT: KVNamespace` to the `CloudflareEnv` type

**Implementation Details**:

- Same pattern as `worker.ts`
- `getPlatformProxy` with `persist: true` provides local KV simulation from `.wrangler` directory

**Reference Implementation**:

```typescript
type CloudflareEnv = {
  HYPERDRIVE_CACHED: Hyperdrive;
  HYPERDRIVE_DIRECT: Hyperdrive;
  AI_RATE_LIMIT: KVNamespace;
} & Env;
```

**Migration Pattern**:

```typescript
// BEFORE (lines 27-30):
type CloudflareEnv = {
  HYPERDRIVE_CACHED: Hyperdrive;
  HYPERDRIVE_DIRECT: Hyperdrive;
} & Env;

// AFTER:
type CloudflareEnv = {
  HYPERDRIVE_CACHED: Hyperdrive;
  HYPERDRIVE_DIRECT: Hyperdrive;
  AI_RATE_LIMIT: KVNamespace;
} & Env;
```

**Dependencies**: `apps/api/lib/env.ts` (updated `Env` type), `apps/api/wrangler.jsonc` (KV binding)
**Provides**: `AI_RATE_LIMIT` available via `cf.env.AI_RATE_LIMIT` in dev server

---

### apps/api/lib/anthropic.ts [create]

**Purpose**: Request-scoped Anthropic client factory using the `ctx.cache` pattern.
**TOTAL CHANGES**: 1

**Changes**:

1. Create file with `getAnthropic` function that caches Anthropic client instances per-request

**Implementation Details**:

- Uses `Symbol("anthropicClient")` as cache key
- Accepts `Pick<TRPCContext, "env" | "cache">` for minimal coupling
- Returns `Anthropic` instance configured with `apiKey` from `ctx.env.ANTHROPIC_API_KEY`
- Throws descriptive error if `ANTHROPIC_API_KEY` is not configured

**Reference Implementation**:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { TRPCContext } from "./context.js";

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
```

**Dependencies**: `apps/api/lib/context.ts` (TRPCContext type), `apps/api/lib/env.ts` (Env with ANTHROPIC_API_KEY)
**Provides**: `getAnthropic(ctx: Pick<TRPCContext, "env" | "cache">) => Anthropic`

---

### apps/api/lib/safety.ts [create]

**Purpose**: Crisis keyword detection, AI crisis marker parsing, gibberish detection, and safety disclaimer prepending.
**TOTAL CHANGES**: 1

**Changes**:

1. Create file with all safety-related pure functions

**Implementation Details**:

- `CRISIS_KEYWORDS`: Array of 16 crisis phrases (lowercase)
- `CRISIS_DISCLAIMER`: Safety message with 988 Suicide & Crisis Lifeline info
- `GENERIC_RESPONSE`: Fallback for gibberish input
- `FALLBACK_RESPONSE`: Fallback for AI errors/timeouts
- `detectKeywordCrisis(note: string) => boolean`: Normalizes text and checks substring matches
- `detectAiCrisis(responseText: string) => boolean`: Checks if text starts with `[CRISIS_DETECTED]`
- `stripCrisisMarker(responseText: string) => string`: Removes `[CRISIS_DETECTED]` marker from response
- `isGibberish(note: string) => boolean`: Returns true if fewer than 3 words > 2 chars pass dictionary check
- `prependCrisisDisclaimer(response: string) => string`: Prepends safety disclaimer to response
- All functions are pure (no side effects, no external dependencies)

**Reference Implementation**:

```typescript
/**
 * Safety module for the AI vibe check feature.
 *
 * Provides dual-layer crisis detection (keyword pre-screen + AI marker parsing),
 * gibberish detection, and safety disclaimer formatting.
 */

export const CRISIS_KEYWORDS = [
  "suicide",
  "suicidal",
  "kill myself",
  "end my life",
  "self-harm",
  "self harm",
  "cutting myself",
  "hurt myself",
  "want to die",
  "don't want to live",
  "no reason to live",
  "end it all",
  "better off dead",
  "can't go on",
  "not worth living",
  "kms",
  "kys",
] as const;

export const CRISIS_DISCLAIMER =
  `If you're in crisis or having thoughts of suicide, please reach out for support:\n\n` +
  `988 Suicide & Crisis Lifeline: Call or text 988 (US)\n` +
  `Crisis Text Line: Text HOME to 741741\n\n`;

export const GENERIC_RESPONSE =
  "Thanks for checking in today. Even showing up to journal is a positive step.";

export const FALLBACK_RESPONSE =
  "I wasn't able to generate a reflection right now. Remember, the act of journaling itself is a powerful step toward self-awareness.";

/**
 * Layer 1: Keyword-based crisis detection.
 *
 * Normalizes the note text (lowercase, trim) and checks for substring
 * matches against the crisis keywords list.
 */
export function detectKeywordCrisis(note: string): boolean {
  const normalized = note.toLowerCase().trim();
  return CRISIS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/**
 * Layer 2: AI-based crisis detection.
 *
 * Checks if the AI response starts with the [CRISIS_DETECTED] marker,
 * indicating the AI identified genuine suicidal ideation or self-harm intent.
 */
export function detectAiCrisis(responseText: string): boolean {
  return responseText.trimStart().startsWith("[CRISIS_DETECTED]");
}

/**
 * Strips the [CRISIS_DETECTED] marker from the AI response text.
 *
 * The marker is an instruction artifact — the empathetic response follows it.
 */
export function stripCrisisMarker(responseText: string): string {
  return responseText.trimStart().replace(/^\[CRISIS_DETECTED\]\s*/, "");
}

/**
 * Detects gibberish input by counting "real" words.
 *
 * A word is considered "real" if it is longer than 2 characters and
 * appears in a basic set of common English words. If fewer than 3 real
 * words are found, the input is considered gibberish.
 *
 * This is a heuristic — not meant to be exhaustive. The threshold is
 * generous enough to pass most legitimate journal entries.
 */
export function isGibberish(note: string): boolean {
  const words = note
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length < 3) return true;

  let realWordCount = 0;
  for (const word of words) {
    // Strip common punctuation for matching
    const clean = word.replace(/[^a-z']/g, "");
    if (clean.length > 2 && COMMON_WORDS.has(clean)) {
      realWordCount++;
      if (realWordCount >= 3) return false;
    }
  }

  return true;
}

/**
 * Prepends the crisis safety disclaimer to an AI response.
 */
export function prependCrisisDisclaimer(response: string): string {
  return CRISIS_DISCLAIMER + response;
}

/**
 * Common English words for gibberish detection.
 *
 * This set covers the most frequently used English words — sufficient
 * to distinguish real journal entries from random character sequences.
 * Not exhaustive by design: the 3-word threshold compensates for gaps.
 */
const COMMON_WORDS = new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "day",
  "get",
  "has",
  "him",
  "his",
  "how",
  "its",
  "let",
  "may",
  "new",
  "now",
  "old",
  "see",
  "way",
  "who",
  "did",
  "got",
  "say",
  "she",
  "too",
  "use",
  "about",
  "after",
  "again",
  "been",
  "being",
  "came",
  "come",
  "could",
  "each",
  "even",
  "feel",
  "feeling",
  "felt",
  "find",
  "first",
  "from",
  "give",
  "good",
  "great",
  "have",
  "help",
  "here",
  "into",
  "just",
  "keep",
  "know",
  "last",
  "life",
  "like",
  "long",
  "look",
  "made",
  "make",
  "many",
  "more",
  "most",
  "much",
  "must",
  "need",
  "never",
  "next",
  "only",
  "over",
  "part",
  "people",
  "place",
  "really",
  "right",
  "said",
  "same",
  "some",
  "still",
  "such",
  "take",
  "tell",
  "than",
  "that",
  "them",
  "then",
  "there",
  "these",
  "they",
  "thing",
  "things",
  "think",
  "this",
  "time",
  "today",
  "very",
  "want",
  "well",
  "went",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "will",
  "with",
  "work",
  "would",
  "year",
  "your",
  "also",
  "back",
  "because",
  "before",
  "between",
  "both",
  "call",
  "down",
  "every",
  "hand",
  "head",
  "home",
  "house",
  "just",
  "left",
  "little",
  "might",
  "mind",
  "morning",
  "night",
  "nothing",
  "other",
  "own",
  "quite",
  "small",
  "something",
  "start",
  "started",
  "through",
  "together",
  "under",
  "until",
  "upon",
  "without",
  "world",
  "young",
  "always",
  "another",
  "around",
  "away",
  "better",
  "best",
  "body",
  "done",
  "enough",
  "ever",
  "family",
  "few",
  "found",
  "friend",
  "friends",
  "hard",
  "happy",
  "heart",
  "high",
  "hope",
  "kind",
  "known",
  "large",
  "later",
  "live",
  "love",
  "man",
  "men",
  "money",
  "name",
  "open",
  "point",
  "power",
  "put",
  "read",
  "real",
  "room",
  "run",
  "school",
  "set",
  "show",
  "side",
  "since",
  "state",
  "story",
  "sure",
  "taken",
  "talk",
  "three",
  "times",
  "turn",
  "turned",
  "used",
  "using",
  "water",
  "woman",
  "women",
  "words",
  "working",
  "bad",
  "calm",
  "sad",
  "angry",
  "anxious",
  "stressed",
  "tired",
  "exhausted",
  "overwhelmed",
  "sleep",
  "slept",
  "ate",
  "exercise",
  "walked",
  "talked",
  "cried",
  "laughed",
  "worried",
  "scared",
  "lonely",
  "grateful",
  "thankful",
  "relaxed",
  "peaceful",
  "journal",
  "mood",
  "energy",
  "thought",
  "thoughts",
  "rough",
  "tough",
  "okay",
  "fine",
  "awful",
  "terrible",
  "wonderful",
  "amazing",
  "difficult",
  "easy",
  "hard",
  "struggled",
  "managed",
  "tried",
  "trying",
]);
```

**Dependencies**: None (pure functions)
**Provides**: `CRISIS_KEYWORDS`, `CRISIS_DISCLAIMER`, `GENERIC_RESPONSE`, `FALLBACK_RESPONSE`, `detectKeywordCrisis(note: string) => boolean`, `detectAiCrisis(responseText: string) => boolean`, `stripCrisisMarker(responseText: string) => string`, `isGibberish(note: string) => boolean`, `prependCrisisDisclaimer(response: string) => string`

---

### apps/api/lib/prompts.ts [create]

**Purpose**: System prompt builder for the AI vibe check feature.
**TOTAL CHANGES**: 1

**Changes**:

1. Create file with `buildVibeCheckPrompt` function

**Implementation Details**:

- Returns `{ system: string; user: string }` for Anthropic message API
- System prompt includes all 9 behavioral rules including the `[CRISIS_DETECTED]` marker instruction
- User prompt formats mood, tags, and note into a structured input

**Reference Implementation**:

```typescript
/**
 * Prompt builder for the AI vibe check feature.
 *
 * Constructs system and user prompts for the Anthropic Claude API
 * based on the journal entry's mood, tags, and note content.
 */

export interface VibeCheckPrompt {
  system: string;
  user: string;
}

/**
 * Builds the system and user prompts for generating a vibe check response.
 *
 * @param mood - The user's selected mood (e.g., "Happy", "Sad")
 * @param tags - Context tags selected by the user (e.g., ["Work", "Fitness"])
 * @param note - The user's journal note text
 * @returns System and user prompt strings for the Anthropic API
 */
export function buildVibeCheckPrompt(
  mood: string,
  tags: string[],
  note: string,
): VibeCheckPrompt {
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
8. Do not ask questions. Your response is a statement of support, not a conversation opener.
9. If the user's note expresses genuine suicidal ideation, self-harm intent, or a desire to end their life, begin your response with the exact marker [CRISIS_DETECTED]. Only flag genuine distress — do not flag casual expressions like "that killed me" or "I'm dying of laughter."`;

  const tagList = tags.length > 0 ? tags.join(", ") : "none selected";
  const user = `Mood: ${mood}\nContext Tags: ${tagList}\nJournal Note: ${note}`;

  return { system, user };
}
```

**Dependencies**: None (pure function)
**Provides**: `VibeCheckPrompt` type, `buildVibeCheckPrompt(mood: string, tags: string[], note: string) => VibeCheckPrompt`

---

### apps/api/lib/rate-limit.ts [create]

**Purpose**: AI request rate limiting via Cloudflare KV with hourly buckets.
**TOTAL CHANGES**: 1

**Changes**:

1. Create file with `checkRateLimit` function

**Implementation Details**:

- Key format: `ratelimit:ai:{userId}:{hourBucket}` where `hourBucket = Math.floor(Date.now() / 3_600_000)`
- TTL: 7200 seconds (2 hours) to ensure cleanup after the hour window passes
- Limit: 20 requests per user per hour
- Returns `{ allowed: boolean; remaining: number; retryAfter: number | null }`
- `retryAfter` is seconds until the next hour bucket when rate limited
- When KV is unavailable (local dev without wrangler), allows all requests

**Reference Implementation**:

```typescript
/**
 * AI request rate limiting via Cloudflare KV.
 *
 * Uses hourly buckets to limit each user to 20 AI requests per hour.
 * Rate limit state is stored in KV with a 2-hour TTL for automatic cleanup.
 */

const MAX_REQUESTS_PER_HOUR = 20;
const HOUR_MS = 3_600_000;
const TTL_SECONDS = 7200; // 2 hours

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number | null;
}

/**
 * Checks and increments the rate limit counter for a user's AI requests.
 *
 * @param kv - Cloudflare KV namespace binding (AI_RATE_LIMIT)
 * @param userId - The authenticated user's ID
 * @returns Rate limit check result with remaining quota and retry info
 */
export async function checkRateLimit(
  kv: KVNamespace | undefined,
  userId: string,
): Promise<RateLimitResult> {
  // When KV is unavailable (e.g., local dev without wrangler), allow all requests
  if (!kv) {
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_HOUR,
      retryAfter: null,
    };
  }

  const hourBucket = Math.floor(Date.now() / HOUR_MS);
  const key = `ratelimit:ai:${userId}:${hourBucket}`;

  const currentStr = await kv.get(key);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  if (current >= MAX_REQUESTS_PER_HOUR) {
    const nextBucketMs = (hourBucket + 1) * HOUR_MS;
    const retryAfter = Math.ceil((nextBucketMs - Date.now()) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  await kv.put(key, String(current + 1), { expirationTtl: TTL_SECONDS });

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_HOUR - current - 1,
    retryAfter: null,
  };
}
```

**Dependencies**: None (uses global `KVNamespace` type from `@cloudflare/workers-types`)
**Provides**: `RateLimitResult` type, `checkRateLimit(kv: KVNamespace | undefined, userId: string) => Promise<RateLimitResult>`

---

### apps/api/routers/ai.ts [create]

**Purpose**: tRPC router with `generateVibeCheck` mutation for non-streaming AI vibe check generation.
**TOTAL CHANGES**: 1

**Changes**:

1. Create file with `aiRouter` containing `generateVibeCheck` mutation

**Implementation Details**:

- Uses `protectedProcedure` for auth enforcement
- Input: `{ entryId: z.string() }`
- Output: `{ response: string; hasCrisisContent: boolean }`
- Flow: validate entry ownership -> check rate limit -> check gibberish -> run keyword crisis -> call Anthropic (non-streaming) -> parse AI crisis marker -> combine crisis flags -> prepend disclaimer if needed -> upsert aiResponse -> return
- Uses `client.messages.create()` for non-streaming call
- Catches Anthropic errors and persists fallback response

**Reference Implementation**:

```typescript
import { TRPCError } from "@trpc/server";
import { aiResponse } from "@repo/db/schema/ai-response.js";
import { z } from "zod";
import { getAnthropic } from "../lib/anthropic.js";
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

const AI_MODEL = "claude-sonnet-4-20250514";

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
        const [persisted] = await ctx.dbDirect
          .insert(aiResponse)
          .values({
            entryId: entry.id,
            response: GENERIC_RESPONSE,
            hasCrisisContent: false,
            model: "none",
          })
          .onConflictDoUpdate({
            target: aiResponse.entryId,
            set: {
              response: GENERIC_RESPONSE,
              hasCrisisContent: false,
              model: "none",
            },
          })
          .returning();

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
          max_tokens: 150,
          temperature: 0.7,
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
      const [persisted] = await ctx.dbDirect
        .insert(aiResponse)
        .values({
          entryId: entry.id,
          response: finalResponse,
          hasCrisisContent,
          model: AI_MODEL,
        })
        .onConflictDoUpdate({
          target: aiResponse.entryId,
          set: {
            response: finalResponse,
            hasCrisisContent,
            model: AI_MODEL,
          },
        })
        .returning();

      return {
        response: persisted.response,
        hasCrisisContent: persisted.hasCrisisContent,
      };
    }),
});
```

**Dependencies**: `apps/api/lib/anthropic.ts`, `apps/api/lib/safety.ts`, `apps/api/lib/prompts.ts`, `apps/api/lib/rate-limit.ts`, `apps/api/lib/trpc.ts`, `db/schema/ai-response.ts`
**Provides**: `aiRouter` with `generateVibeCheck` mutation

---

### apps/api/lib/app.ts [edit]

**Purpose**: Register the AI tRPC router and add the SSE streaming endpoint.
**TOTAL CHANGES**: 3

**Changes**:

1. Add imports for `aiRouter`, `streamSSE`, and all AI library modules (after line 4)
2. Add `ai: aiRouter` to the `appRouter` (line 18-22)
3. Add SSE streaming endpoint `GET /api/ai/stream/:entryId` before the tRPC handler (before line 61)

**Implementation Details**:

- The SSE endpoint is a plain Hono route because tRPC does not support SSE streaming natively
- Auth is validated by calling Better Auth `api.getSession()` with request headers (same pattern as tRPC context creation at lines 83-86)
- SSE events: `token` (partial text), `done` (full response + hasCrisisContent), `error` (error description)
- 10s timeout via `setTimeout` + `stream.close()`
- Client disconnect via `stream.onAbort()`
- Fallback response persisted on error/timeout

**Reference Implementation**:

```typescript
/**
 * @file Hono app construction and tRPC router initialization.
 *
 * Combines authentication, tRPC, and health check endpoints into a single HTTP router.
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { aiResponse } from "@repo/db/schema/ai-response.js";
import type { AppContext } from "./context.js";
import { getAnthropic } from "./anthropic.js";
import { buildVibeCheckPrompt } from "./prompts.js";
import { checkRateLimit } from "./rate-limit.js";
import {
  FALLBACK_RESPONSE,
  GENERIC_RESPONSE,
  detectAiCrisis,
  detectKeywordCrisis,
  isGibberish,
  prependCrisisDisclaimer,
  stripCrisisMarker,
} from "./safety.js";
import { router } from "./trpc.js";
import { aiRouter } from "../routers/ai.js";
import { billingRouter } from "../routers/billing.js";
import { journalRouter } from "../routers/journal.js";
import { organizationRouter } from "../routers/organization.js";
import { userRouter } from "../routers/user.js";

const AI_MODEL = "claude-sonnet-4-20250514";

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
    await dbDirect
      .insert(aiResponse)
      .values({
        entryId: entry.id,
        response: GENERIC_RESPONSE,
        hasCrisisContent: false,
        model: "none",
      })
      .onConflictDoUpdate({
        target: aiResponse.entryId,
        set: {
          response: GENERIC_RESPONSE,
          hasCrisisContent: false,
          model: "none",
        },
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
      Awaited<ReturnType<typeof getAnthropic>>["messages"]["stream"]
    > | null = null;
    let accumulatedText = "";
    let aborted = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Client disconnect handler
    stream.onAbort(() => {
      aborted = true;
      anthropicStream?.abort();
      clearTimeout(timeoutId);
    });

    // 10s timeout
    timeoutId = setTimeout(() => {
      aborted = true;
      anthropicStream?.abort();
    }, 10_000);

    try {
      const anthropic = getAnthropic({
        env: c.env,
        cache: new Map(),
      });

      anthropicStream = anthropic.messages.stream({
        model: AI_MODEL,
        max_tokens: 150,
        temperature: 0.7,
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
        await dbDirect
          .insert(aiResponse)
          .values({
            entryId: entry.id,
            response: FALLBACK_RESPONSE,
            hasCrisisContent: false,
            model: AI_MODEL,
          })
          .onConflictDoUpdate({
            target: aiResponse.entryId,
            set: {
              response: FALLBACK_RESPONSE,
              hasCrisisContent: false,
              model: AI_MODEL,
            },
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
      await dbDirect
        .insert(aiResponse)
        .values({
          entryId: entry.id,
          response: finalResponse,
          hasCrisisContent,
          model: AI_MODEL,
        })
        .onConflictDoUpdate({
          target: aiResponse.entryId,
          set: {
            response: finalResponse,
            hasCrisisContent,
            model: AI_MODEL,
          },
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
      await dbDirect
        .insert(aiResponse)
        .values({
          entryId: entry.id,
          response: FALLBACK_RESPONSE,
          hasCrisisContent: keywordCrisisFlag,
          model: AI_MODEL,
        })
        .onConflictDoUpdate({
          target: aiResponse.entryId,
          set: {
            response: FALLBACK_RESPONSE,
            hasCrisisContent: keywordCrisisFlag,
            model: AI_MODEL,
          },
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
```

**Dependencies**: `apps/api/routers/ai.ts`, `apps/api/lib/anthropic.ts`, `apps/api/lib/safety.ts`, `apps/api/lib/prompts.ts`, `apps/api/lib/rate-limit.ts`
**Provides**: Updated `appRouter` with `ai` router, SSE endpoint at `GET /api/ai/stream/:entryId`

---

### apps/api/lib/safety.test.ts [create]

**Purpose**: Unit tests for the safety module (crisis detection, gibberish detection, marker parsing).
**TOTAL CHANGES**: 1

**Changes**:

1. Create comprehensive test file covering all exported functions

**Implementation Details**:

- Tests `detectKeywordCrisis` with all 16 keywords + negative cases (casual expressions)
- Tests `detectAiCrisis` with marker present/absent
- Tests `stripCrisisMarker` with marker present/absent/whitespace variations
- Tests `isGibberish` with real journal entries vs random characters
- Tests `prependCrisisDisclaimer` output format

**Reference Implementation**:

```typescript
import { describe, expect, it } from "vitest";
import {
  CRISIS_DISCLAIMER,
  CRISIS_KEYWORDS,
  FALLBACK_RESPONSE,
  GENERIC_RESPONSE,
  detectAiCrisis,
  detectKeywordCrisis,
  isGibberish,
  prependCrisisDisclaimer,
  stripCrisisMarker,
} from "./safety";

// ---------------------------------------------------------------------------
// detectKeywordCrisis
// ---------------------------------------------------------------------------

describe("detectKeywordCrisis", () => {
  it.each(CRISIS_KEYWORDS.map((keyword) => [keyword]))(
    "detects crisis keyword: '%s'",
    (keyword) => {
      expect(detectKeywordCrisis(`I feel like ${keyword} today`)).toBe(true);
    },
  );

  it("detects keywords regardless of case", () => {
    expect(detectKeywordCrisis("I feel SUICIDAL")).toBe(true);
    expect(detectKeywordCrisis("Want To Die")).toBe(true);
  });

  it("detects keywords with surrounding whitespace", () => {
    expect(detectKeywordCrisis("   suicide   ")).toBe(true);
  });

  it("does not flag casual expressions", () => {
    expect(detectKeywordCrisis("That joke killed me")).toBe(false);
    expect(detectKeywordCrisis("I'm dying of laughter")).toBe(false);
    expect(detectKeywordCrisis("This deadline is killing me")).toBe(false);
  });

  it("does not flag positive journal entries", () => {
    expect(detectKeywordCrisis("Had a great day at work today")).toBe(false);
    expect(
      detectKeywordCrisis("Feeling happy and grateful for my friends"),
    ).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(detectKeywordCrisis("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// detectAiCrisis
// ---------------------------------------------------------------------------

describe("detectAiCrisis", () => {
  it("detects [CRISIS_DETECTED] marker at start of response", () => {
    expect(
      detectAiCrisis(
        "[CRISIS_DETECTED] I hear you're going through a very difficult time.",
      ),
    ).toBe(true);
  });

  it("detects marker with leading whitespace", () => {
    expect(detectAiCrisis("  [CRISIS_DETECTED] Response text")).toBe(true);
  });

  it("returns false when marker is absent", () => {
    expect(detectAiCrisis("You seem to be having a good day!")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(detectAiCrisis("")).toBe(false);
  });

  it("returns false when marker appears mid-text", () => {
    expect(detectAiCrisis("Some text before [CRISIS_DETECTED] after")).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// stripCrisisMarker
// ---------------------------------------------------------------------------

describe("stripCrisisMarker", () => {
  it("strips [CRISIS_DETECTED] marker from response", () => {
    expect(stripCrisisMarker("[CRISIS_DETECTED] I hear your pain.")).toBe(
      "I hear your pain.",
    );
  });

  it("strips marker with extra whitespace", () => {
    expect(stripCrisisMarker("  [CRISIS_DETECTED]   Response text")).toBe(
      "Response text",
    );
  });

  it("returns original text when no marker present", () => {
    expect(stripCrisisMarker("You seem happy today!")).toBe(
      "You seem happy today!",
    );
  });

  it("returns empty string for empty input", () => {
    expect(stripCrisisMarker("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// isGibberish
// ---------------------------------------------------------------------------

describe("isGibberish", () => {
  it("returns true for random characters", () => {
    expect(isGibberish("asdfghjkl qwerty zxcvbn")).toBe(true);
  });

  it("returns true for empty string", () => {
    expect(isGibberish("")).toBe(true);
  });

  it("returns true for single word", () => {
    expect(isGibberish("hello")).toBe(true);
  });

  it("returns true for two real words", () => {
    expect(isGibberish("feeling good")).toBe(true);
  });

  it("returns false for three or more real words", () => {
    expect(isGibberish("feeling good today")).toBe(false);
  });

  it("returns false for a typical journal entry", () => {
    expect(isGibberish("Had a great day at work today")).toBe(false);
  });

  it("returns false for emotional journal entries", () => {
    expect(
      isGibberish("Feeling really sad and overwhelmed with everything"),
    ).toBe(false);
  });

  it("returns true for repeated nonsense characters", () => {
    expect(isGibberish("zzz qqq xxx ppp bbb")).toBe(true);
  });

  it("ignores words with 2 or fewer characters", () => {
    expect(isGibberish("I am ok")).toBe(true);
  });

  it("handles punctuation in words", () => {
    expect(isGibberish("feeling good, really great today!")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// prependCrisisDisclaimer
// ---------------------------------------------------------------------------

describe("prependCrisisDisclaimer", () => {
  it("prepends crisis disclaimer to response", () => {
    const response = "I hear you're going through a difficult time.";
    const result = prependCrisisDisclaimer(response);

    expect(result).toContain("988 Suicide & Crisis Lifeline");
    expect(result).toContain("Crisis Text Line");
    expect(result).toContain(response);
    expect(result).toBe(CRISIS_DISCLAIMER + response);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("safety constants", () => {
  it("has 17 crisis keywords", () => {
    expect(CRISIS_KEYWORDS).toHaveLength(17);
  });

  it("GENERIC_RESPONSE is defined", () => {
    expect(GENERIC_RESPONSE).toBeTruthy();
    expect(typeof GENERIC_RESPONSE).toBe("string");
  });

  it("FALLBACK_RESPONSE is defined", () => {
    expect(FALLBACK_RESPONSE).toBeTruthy();
    expect(typeof FALLBACK_RESPONSE).toBe("string");
  });
});
```

**Dependencies**: `apps/api/lib/safety.ts`
**Provides**: Test coverage for safety module

---

### apps/api/lib/prompts.test.ts [create]

**Purpose**: Unit tests for the prompt builder.
**TOTAL CHANGES**: 1

**Changes**:

1. Create test file covering `buildVibeCheckPrompt` function

**Implementation Details**:

- Tests system prompt content (all 9 rules present)
- Tests user prompt formatting with various inputs
- Tests empty tags rendering as "none selected"
- Tests special characters in note text

**Reference Implementation**:

```typescript
import { describe, expect, it } from "vitest";
import { buildVibeCheckPrompt } from "./prompts";

describe("buildVibeCheckPrompt", () => {
  it("returns system and user prompt strings", () => {
    const result = buildVibeCheckPrompt("Happy", ["Work"], "Great day");

    expect(result.system).toBeDefined();
    expect(result.user).toBeDefined();
    expect(typeof result.system).toBe("string");
    expect(typeof result.user).toBe("string");
  });

  it("system prompt contains all behavioral rules", () => {
    const { system } = buildVibeCheckPrompt("Happy", [], "");

    expect(system).toContain("1-2 sentences");
    expect(system).toContain("non-judgmental");
    expect(system).toContain("[CRISIS_DETECTED]");
    expect(system).toContain("Do not ask questions");
    expect(system).toContain("warm, conversational tone");
  });

  it("system prompt instructs not to flag casual expressions", () => {
    const { system } = buildVibeCheckPrompt("Happy", [], "");

    expect(system).toContain("that killed me");
    expect(system).toContain("I'm dying of laughter");
  });

  it("user prompt includes mood", () => {
    const { user } = buildVibeCheckPrompt("Anxious", ["Work"], "Stressed out");

    expect(user).toContain("Mood: Anxious");
  });

  it("user prompt includes tags as comma-separated list", () => {
    const { user } = buildVibeCheckPrompt("Happy", ["Work", "Fitness"], "");

    expect(user).toContain("Context Tags: Work, Fitness");
  });

  it('user prompt shows "none selected" when no tags', () => {
    const { user } = buildVibeCheckPrompt("Calm", [], "Quiet day");

    expect(user).toContain("Context Tags: none selected");
  });

  it("user prompt includes journal note", () => {
    const { user } = buildVibeCheckPrompt(
      "Sad",
      ["Relationships"],
      "Had a difficult conversation with my partner",
    );

    expect(user).toContain(
      "Journal Note: Had a difficult conversation with my partner",
    );
  });

  it("handles special characters in note", () => {
    const { user } = buildVibeCheckPrompt(
      "Happy",
      [],
      'Note with "quotes" & <brackets>',
    );

    expect(user).toContain('Note with "quotes" & <brackets>');
  });

  it("handles empty note", () => {
    const { user } = buildVibeCheckPrompt("Calm", [], "");

    expect(user).toContain("Journal Note: ");
  });
});
```

**Dependencies**: `apps/api/lib/prompts.ts`
**Provides**: Test coverage for prompts module

---

### apps/api/routers/ai.test.ts [create]

**Purpose**: Integration tests for the AI router using mock Anthropic API.
**TOTAL CHANGES**: 1

**Changes**:

1. Create test file covering `generateVibeCheck` mutation with mocked dependencies

**Implementation Details**:

- Follows the existing `testCtx()` pattern from `journal.test.ts`
- Mocks `@anthropic-ai/sdk` module with `vi.mock`
- Tests: successful generation, entry not found, entry not owned, gibberish input, crisis keyword detection, AI crisis marker detection, rate limiting, Anthropic API error fallback
- Mock Anthropic `.messages.create()` to return controlled responses

**Reference Implementation**:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { TRPCContext } from "../lib/context";
import { createCallerFactory } from "../lib/trpc";
import { aiRouter } from "./ai";

// Mock the Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: "text",
              text: "It sounds like you had a wonderful day!",
            },
          ],
        }),
        stream: vi.fn(),
      },
    })),
  };
});

const createCaller = createCallerFactory(aiRouter);

// ---------------------------------------------------------------------------
// Test context factory
// ---------------------------------------------------------------------------

function testCtx({
  userId = "usr_test-user-1",
  findFirst = vi.fn().mockResolvedValue(undefined),
  insertReturning = vi.fn().mockResolvedValue([]),
  anthropicApiKey = "sk-ant-test-key-123",
  kvGet = vi.fn().mockResolvedValue(null),
  kvPut = vi.fn().mockResolvedValue(undefined),
} = {}) {
  const kv = {
    get: kvGet,
    put: kvPut,
  } as unknown as KVNamespace;

  const ctx: TRPCContext = {
    req: new Request("http://localhost"),
    info: {} as TRPCContext["info"],
    session: {
      id: "ses_test-session",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      token: "token",
      activeOrganizationId: undefined,
    },
    user: {
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: "test@example.com",
      emailVerified: true,
      name: "Test User",
    },
    db: {
      query: {
        journalEntry: {
          findFirst,
        },
      },
    } as unknown as TRPCContext["db"],
    dbDirect: {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: insertReturning,
          }),
          returning: insertReturning,
        }),
      }),
    } as unknown as TRPCContext["dbDirect"],
    cache: new Map(),
    env: {
      ANTHROPIC_API_KEY: anthropicApiKey,
      AI_RATE_LIMIT: kv,
    } as TRPCContext["env"],
  };

  return ctx;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = new Date("2026-03-09T12:00:00Z");

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "jrn_test-entry-1",
    userId: "usr_test-user-1",
    mood: "Happy",
    tags: ["Work", "Fitness"],
    note: "Had a really great day at work today",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ai.generateVibeCheck
// ---------------------------------------------------------------------------

describe("ai.generateVibeCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a vibe check for a valid entry", async () => {
    const entry = makeEntry();
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response: "It sounds like you had a wonderful day!",
      hasCrisisContent: false,
      model: "claude-sonnet-4-20250514",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    const result = await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(result.response).toBe("It sounds like you had a wonderful day!");
    expect(result.hasCrisisContent).toBe(false);
  });

  it("throws NOT_FOUND when entry does not exist", async () => {
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).generateVibeCheck({ entryId: "jrn_nonexistent" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("throws NOT_FOUND when entry belongs to another user", async () => {
    const ctx = testCtx({
      userId: "usr_user-a",
      findFirst: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      createCaller(ctx).generateVibeCheck({ entryId: "jrn_user-b-entry" }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("returns generic response for gibberish input", async () => {
    const entry = makeEntry({ note: "asdfghjkl qwerty zxcvbn" });
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response:
        "Thanks for checking in today. Even showing up to journal is a positive step.",
      hasCrisisContent: false,
      model: "none",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    const result = await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(result.response).toContain("checking in today");
    expect(result.hasCrisisContent).toBe(false);
  });

  it("detects crisis keywords and prepends disclaimer", async () => {
    const entry = makeEntry({ note: "I want to kill myself" });
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response:
        "If you're in crisis or having thoughts of suicide, please reach out for support:\n\n988 Suicide & Crisis Lifeline: Call or text 988 (US)\nCrisis Text Line: Text HOME to 741741\n\nI hear you're going through an incredibly difficult time.",
      hasCrisisContent: true,
      model: "claude-sonnet-4-20250514",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    const result = await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(result.hasCrisisContent).toBe(true);
    expect(result.response).toContain("988 Suicide & Crisis Lifeline");
  });

  it("throws TOO_MANY_REQUESTS when rate limited", async () => {
    const entry = makeEntry();
    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      kvGet: vi.fn().mockResolvedValue("20"),
    });

    await expect(
      createCaller(ctx).generateVibeCheck({ entryId: "jrn_test-entry-1" }),
    ).rejects.toThrow("Rate limit exceeded");
  });

  it("handles Anthropic API errors with fallback response", async () => {
    // Override the mock to throw an error
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    vi.mocked(Anthropic).mockImplementationOnce(
      () =>
        ({
          messages: {
            create: vi.fn().mockRejectedValue(new Error("API Error")),
          },
        }) as never,
    );

    const entry = makeEntry();
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response:
        "I wasn't able to generate a reflection right now. Remember, the act of journaling itself is a powerful step toward self-awareness.",
      hasCrisisContent: false,
      model: "claude-sonnet-4-20250514",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    const result = await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(result.response).toContain("wasn't able to generate a reflection");
    expect(result.hasCrisisContent).toBe(false);
  });

  it("persists AI response via upsert", async () => {
    const entry = makeEntry();
    const persisted = {
      id: "air_test-1",
      entryId: entry.id,
      response: "It sounds like you had a wonderful day!",
      hasCrisisContent: false,
      model: "claude-sonnet-4-20250514",
      createdAt: now,
    };

    const ctx = testCtx({
      findFirst: vi.fn().mockResolvedValue(entry),
      insertReturning: vi.fn().mockResolvedValue([persisted]),
    });

    await createCaller(ctx).generateVibeCheck({
      entryId: "jrn_test-entry-1",
    });

    expect(ctx.dbDirect.insert).toHaveBeenCalled();
  });
});
```

**Dependencies**: `apps/api/routers/ai.ts`, `apps/api/lib/safety.ts`, `apps/api/lib/prompts.ts`
**Provides**: Test coverage for AI router

---

## Dependency Graph

> Converters use this to build `dependsOn` (prd.json) or `depends_on` (beads).
> Files in the same phase can execute in parallel. Later phases depend on earlier ones.

| Phase | File                           | Action                                                     | Depends On                                                                                                                               |
| ----- | ------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `apps/api/package.json`        | edit                                                       | --                                                                                                                                       |
| 1     | `apps/api/lib/safety.ts`       | create                                                     | --                                                                                                                                       |
| 1     | `apps/api/lib/prompts.ts`      | create                                                     | --                                                                                                                                       |
| 1     | `apps/api/lib/rate-limit.ts`   | create                                                     | --                                                                                                                                       |
| 1     | `apps/api/wrangler.jsonc`      | edit                                                       | --                                                                                                                                       |
| 2     | `apps/api/lib/env.ts`          | edit                                                       | --                                                                                                                                       |
| 2     | `apps/api/lib/safety.test.ts`  | create                                                     | `apps/api/lib/safety.ts`                                                                                                                 |
| 2     | `apps/api/lib/prompts.test.ts` | create                                                     | `apps/api/lib/prompts.ts`                                                                                                                |
| 3     | `apps/api/lib/anthropic.ts`    | create                                                     | `apps/api/lib/env.ts`                                                                                                                    |
| 3     | `apps/api/worker.ts`           | edit                                                       | `apps/api/lib/env.ts`, `apps/api/wrangler.jsonc`                                                                                         |
| 3     | `apps/api/dev.ts`              | edit                                                       | `apps/api/lib/env.ts`, `apps/api/wrangler.jsonc`                                                                                         |
| 4     | `apps/api/routers/ai.ts`       | create                                                     | `apps/api/lib/anthropic.ts`, `apps/api/lib/safety.ts`, `apps/api/lib/prompts.ts`, `apps/api/lib/rate-limit.ts`                           |
| 5     | `apps/api/lib/app.ts`          | edit                                                       | `apps/api/routers/ai.ts`, `apps/api/lib/anthropic.ts`, `apps/api/lib/safety.ts`, `apps/api/lib/prompts.ts`, `apps/api/lib/rate-limit.ts` |
| 5     | `apps/api/routers/ai.test.ts`  | create                                                     | `apps/api/routers/ai.ts`                                                                                                                 |
| 6     | --                             | Run `/simplify`                                            | All implementation files                                                                                                                 |
| 7     | --                             | Run `bun prettier --write .` then `bun prettier --check .` | Phase 6                                                                                                                                  |
| 8     | --                             | Run `bun test --run` and `bun typecheck`                   | Phase 7                                                                                                                                  |

---

## Exit Criteria

### Test Commands

```bash
bun test --run               # All Vitest tests (unit + integration)
bun api:test -- --run        # API-specific tests
bun lint                     # ESLint with cache
bun typecheck                # tsc --build (all workspaces)
```

### Success Conditions

- [ ] All tests pass (`bun test --run` exit code 0)
- [ ] No linting errors (`bun lint` exit code 0)
- [ ] No type errors (`bun typecheck` exit code 0)
- [ ] Safety module tests cover all 17 crisis keywords
- [ ] Gibberish detection correctly classifies real vs nonsense input
- [ ] AI router tests cover: happy path, not found, ownership, gibberish, crisis keyword, rate limiting, API error fallback
- [ ] Prompt builder tests verify system prompt rules and user prompt formatting
- [ ] SSE endpoint registered at `GET /api/ai/stream/:entryId`
- [ ] tRPC `ai.generateVibeCheck` mutation registered in app router
- [ ] KV namespace `AI_RATE_LIMIT` configured in all wrangler environments
- [ ] `/simplify` command has been run and all findings addressed
- [ ] `bun prettier --check .` passes (formatting verified)
- [ ] All 15 requirements from ### Requirements are satisfied

### Verification Script

```bash
bun test --run && bun lint && bun typecheck
```

### Mandatory Cleanup Steps

**Step 6: Run `/simplify`** -- After all implementation is complete, run the `/simplify` command to review all changed code for reuse opportunities, code quality issues, and efficiency improvements. Fix all identified issues, bugs, and suggestions before proceeding.

**Step 7: Format** -- Run `bun prettier --write .` to auto-fix formatting, then `bun prettier --check .` to verify all files pass CI formatting checks.

**Step 8: Final Verification** -- Run `bun test --run` to verify all tests still pass after simplification and formatting. Run `bun typecheck` to verify type safety. Both must exit with code 0.
