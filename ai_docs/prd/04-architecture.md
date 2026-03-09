# 5. Technical Architecture

> **Context:** Module mapping, file trees, and new dependencies. Reference when creating new files or understanding code organization.

---

## 5.1 Architecture Overview

Serene builds on the existing three-worker architecture:

```
[Browser] --> [Web Worker (Astro)] --> [App Worker (React SPA)]
                                  --> [API Worker (Hono + tRPC)]
                                         |
                                         +--> [PostgreSQL (Neon/Docker)]
                                         +--> [Anthropic Claude API]
```

No architectural changes to the worker topology or service binding pattern. New features are additive modules within existing workers.

## 5.2 Monorepo Module Mapping

| Feature Domain | API Module | App Module | Shared Types |
|----------------|-----------|------------|--------------|
| Mood Journaling | `apps/api/routers/journal.ts` | `apps/app/routes/(app)/journal/` | `packages/core/src/journal.ts` |
| AI Vibe Check | `apps/api/routers/ai.ts` | (consumed via journal components) | `packages/core/src/ai.ts` |
| Visual Analytics | `apps/api/routers/analytics.ts` | `apps/app/routes/(app)/analytics.tsx` | `packages/core/src/analytics.ts` |
| Landing Page | N/A | N/A | N/A (Astro pages in `apps/web/`) |

## 5.3 New Dependencies

| Package | Purpose | Install Location |
|---------|---------|-----------------|
| `@anthropic-ai/sdk` | Claude API client | `apps/api` |
| `recharts` | Chart visualization | `apps/app` |
| `date-fns` | Date manipulation and formatting | `packages/core` |

## 5.4 API Module Structure (Detailed)

```
apps/api/
  routers/
    journal.ts            # tRPC router: CRUD for journal entries
    journal.test.ts       # Tests for journal router
    ai.ts                 # tRPC router: AI vibe check generation
    ai.test.ts            # Tests for AI router
    analytics.ts          # tRPC router: mood analytics queries
    analytics.test.ts     # Tests for analytics router
  lib/
    anthropic.ts          # Request-scoped Anthropic client (Symbol + ctx.cache pattern)
    safety.ts             # Crisis keyword detection + gibberish detection
    safety.test.ts        # Tests for safety module
    prompts.ts            # System prompt builder for AI vibe check
    prompts.test.ts       # Tests for prompt construction
```

## 5.5 App Module Structure (Detailed)

```
apps/app/
  routes/(app)/
    journal/
      index.tsx           # Journal page (entry form + timeline)
      $entryId.tsx        # Entry detail view (dynamic route)
    analytics.tsx          # Analytics page (charts + insights)
  components/
    journal/
      mood-selector.tsx    # Mood card grid
      mood-selector.test.tsx
      tag-chips.tsx        # Multi-select tag chips
      tag-chips.test.tsx
      note-editor.tsx      # Textarea with character counter
      note-editor.test.tsx
      entry-form.tsx       # Composite form (mood + tags + note + save)
      entry-form.test.tsx
      timeline.tsx         # Grouped entry list with infinite scroll
      timeline.test.tsx
      entry-card.tsx       # Individual entry in timeline
      entry-card.test.tsx
      ai-response.tsx      # AI vibe check display with streaming
      ai-response.test.tsx
      safety-banner.tsx    # Crisis resource banner
      safety-banner.test.tsx
    analytics/
      mood-bar-chart.tsx   # Weekly mood distribution chart
      mood-bar-chart.test.tsx
      mood-trend-chart.tsx # 30-day trend line chart
      mood-trend-chart.test.tsx
      tag-correlation.tsx  # Tag-mood correlation table
      tag-correlation.test.tsx
  lib/
    queries/
      journal.ts           # TanStack Query hooks for journal entries
      analytics.ts         # TanStack Query hooks for analytics data
```
