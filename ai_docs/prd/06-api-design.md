# 7. API Design

> **Context:** tRPC routers, input/output schemas, SSE endpoint. Reference when implementing backend procedures.

All procedures use `protectedProcedure`. All queries filter by `ctx.user.id`.

---

## 7.1 tRPC Router: `journal`

### `journal.create`

**Type:** Mutation
**Input:**
```typescript
z.object({
  mood: z.enum(["Happy", "Calm", "Anxious", "Sad", "Overwhelmed", "Angry"]),
  tags: z.array(
    z.enum(["Work", "Sleep", "Relationships", "Fitness", "Hobbies", "Health", "Social", "Nature"])
  ).default([]),
  note: z.string().max(5000).default(""),
})
```
**Output:**
```typescript
{
  id: string;
  mood: string;
  tags: string[];
  note: string;
  createdAt: Date;
  updatedAt: Date;
}
```
**Behavior:**
1. Validate input.
2. Insert entry into `journalEntry` table with `userId = ctx.user.id`.
3. Return the created entry.
4. AI vibe check is triggered separately (not part of this mutation).

### `journal.list`

**Type:** Query
**Input:**
```typescript
z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
})
```
**Output:**
```typescript
{
  entries: Array<{
    id: string;
    mood: string;
    tags: string[];
    note: string;
    createdAt: Date;
    updatedAt: Date;
    aiResponse: {
      response: string;
      hasCrisisContent: boolean;
    } | null;
  }>;
  nextCursor: string | null;
}
```
**Behavior:**
1. Query `journalEntry` with `userId = ctx.user.id`, ordered by `createdAt DESC`.
2. Include related `aiResponse` via Drizzle relations.
3. Apply cursor-based pagination using the composite of `createdAt` and `id`.
4. Parse `tags` from JSON string to array before returning.

### `journal.getById`

**Type:** Query
**Input:**
```typescript
z.object({
  id: z.string(),
})
```
**Output:** Single entry with AI response (same shape as list item), or throws `NOT_FOUND`.
**Behavior:**
1. Query by `id` AND `userId = ctx.user.id`.
2. If not found, throw `TRPCError({ code: "NOT_FOUND" })`.

### `journal.update`

**Type:** Mutation
**Input:**
```typescript
z.object({
  id: z.string(),
  mood: z.enum(["Happy", "Calm", "Anxious", "Sad", "Overwhelmed", "Angry"]).optional(),
  tags: z.array(
    z.enum(["Work", "Sleep", "Relationships", "Fitness", "Hobbies", "Health", "Social", "Nature"])
  ).optional(),
  note: z.string().max(5000).optional(),
})
```
**Output:** Updated entry object.
**Behavior:**
1. Verify entry exists and belongs to `ctx.user.id`.
2. Update only provided fields.
3. If note changed and has >= 50 characters, mark for AI re-analysis (client decides whether to call AI endpoint).

### `journal.delete`

**Type:** Mutation
**Input:**
```typescript
z.object({
  id: z.string(),
})
```
**Output:** `{ success: true }`
**Behavior:**
1. Verify entry exists and belongs to `ctx.user.id`.
2. Hard delete the entry (cascades to `aiResponse`).
3. If not found or not owned, throw `TRPCError({ code: "NOT_FOUND" })`.

---

## 7.2 tRPC Router: `ai`

### `ai.generateVibeCheck`

**Type:** Mutation
**Input:**
```typescript
z.object({
  entryId: z.string(),
})
```
**Output:**
```typescript
{
  response: string;
  hasCrisisContent: boolean;
}
```
**Behavior:**
1. Fetch the journal entry by `id` AND `ctx.user.id`.
2. If entry not found, throw `NOT_FOUND`.
3. If note is empty or < 50 characters, return generic response.
4. Run crisis keyword detection on note text.
5. Call Anthropic Claude API with system prompt, mood, tags, and note.
6. Upsert AI response into `aiResponse` table (replace previous if re-analyzing).
7. If crisis content detected, prepend safety disclaimer.
8. Return the response.

### `ai.streamVibeCheck` (SSE Endpoint)

**Type:** Non-tRPC Hono route (SSE streaming not natively supported in tRPC mutations)
**Route:** `GET /api/ai/stream/:entryId`
**Authentication:** Validate session from request headers using Better Auth.
**Behavior:**
1. Authenticate the request.
2. Fetch entry, validate ownership.
3. If note < 50 chars, send single SSE event with generic response and close.
4. Run crisis detection.
5. Stream Anthropic response via SSE.
6. On stream completion, persist the full response to `aiResponse` table.
7. If crisis content detected, send disclaimer as first SSE event.

**SSE Event Format:**
```
event: token
data: {"text": "partial response text"}

event: done
data: {"response": "full response", "hasCrisisContent": false}

event: error
data: {"message": "error description"}
```

---

## 7.3 tRPC Router: `analytics`

### `analytics.weeklyMoodDistribution`

**Type:** Query
**Input:**
```typescript
z.object({
  weekStart: z.string().date(), // ISO date string for the Monday of the week
})
```
**Output:**
```typescript
{
  distribution: Array<{
    mood: string;
    count: number;
  }>;
  totalEntries: number;
}
```
**Behavior:** Aggregate `COUNT(*)` grouped by `mood` for entries in the given week, filtered by `ctx.user.id`.

### `analytics.moodTrend`

**Type:** Query
**Input:**
```typescript
z.object({
  days: z.number().min(7).max(90).default(30),
})
```
**Output:**
```typescript
{
  trend: Array<{
    date: string;       // ISO date
    averageScore: number;
    entryCount: number;
    moods: Record<string, number>; // mood name -> count
  }>;
}
```
**Behavior:** Aggregate daily mood entries for the past N days, calculate average mood score per day.

### `analytics.tagCorrelation`

**Type:** Query
**Input:** None (uses all user entries).
**Output:**
```typescript
{
  correlations: Array<{
    tag: string;
    entryCount: number;
    averageMoodScore: number;
  }>;
}
```
**Behavior:** Parse tags from all entries, calculate average mood score per tag. Filter to tags with >= 3 entries.

---

## 7.4 Router Registration

Update `apps/api/lib/app.ts`:

```typescript
import { journalRouter } from "../routers/journal.js";
import { aiRouter } from "../routers/ai.js";
import { analyticsRouter } from "../routers/analytics.js";

const appRouter = router({
  billing: billingRouter,
  user: userRouter,
  organization: organizationRouter,
  journal: journalRouter,
  ai: aiRouter,
  analytics: analyticsRouter,
});
```

Add SSE route in `apps/api/lib/app.ts` (before the tRPC handler):
```typescript
app.get("/api/ai/stream/:entryId", streamVibeCheckHandler);
```
